import { ImageAnnotatorClient } from '@google-cloud/vision';
import { TextractClient, AnalyzeExpenseCommand } from '@aws-sdk/client-textract';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { OCRResult } from './receipt.service';

// OCR Provider types
export type OCRProvider = 'google' | 'aws' | 'both';

export class OCRService {
  private googleClient: ImageAnnotatorClient | null = null;
  private textractClient: TextractClient | null = null;
  private provider: OCRProvider;
  private confidenceThreshold: number;

  constructor() {
    this.provider = (process.env.OCR_PROVIDER as OCRProvider) || 'google';
    this.confidenceThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '0.8');

    // Initialize Google Cloud Vision client
    if (this.provider === 'google' || this.provider === 'both') {
      try {
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentialsPath && fs.existsSync(credentialsPath)) {
          this.googleClient = new ImageAnnotatorClient({
            keyFilename: credentialsPath,
          });
          logger.info('Google Cloud Vision client initialized');
        } else {
          logger.warn('Google Cloud Vision credentials not found. Google OCR disabled.');
        }
      } catch (error) {
        logger.error('Error initializing Google Cloud Vision client:', error);
      }
    }

    // Initialize AWS Textract client
    if (this.provider === 'aws' || this.provider === 'both') {
      try {
        this.textractClient = new TextractClient({
          region: process.env.AWS_TEXTRACT_REGION || process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
          },
        });
        logger.info('AWS Textract client initialized');
      } catch (error) {
        logger.error('Error initializing AWS Textract client:', error);
      }
    }
  }

  /**
   * Process receipt with OCR
   */
  async processReceipt(filePath: string): Promise<OCRResult> {
    logger.info(`Processing receipt with OCR: ${filePath}`);

    try {
      // Try primary provider first
      if (this.provider === 'google' && this.googleClient) {
        return await this.processWithGoogle(filePath);
      } else if (this.provider === 'aws' && this.textractClient) {
        return await this.processWithAWS(filePath);
      } else if (this.provider === 'both') {
        // Try Google first, fallback to AWS
        try {
          if (this.googleClient) {
            return await this.processWithGoogle(filePath);
          }
        } catch (googleError) {
          logger.warn('Google Cloud Vision failed, trying AWS Textract:', googleError);
          if (this.textractClient) {
            return await this.processWithAWS(filePath);
          }
        }
      }

      throw new Error('No OCR provider available');
    } catch (error) {
      logger.error('Error processing receipt with OCR:', error);
      throw error;
    }
  }

  /**
   * Process receipt with Google Cloud Vision
   */
  private async processWithGoogle(filePath: string): Promise<OCRResult> {
    if (!this.googleClient) {
      throw new Error('Google Cloud Vision client not initialized');
    }

    const fullPath = path.join(process.cwd(), filePath);
    const imageBuffer = fs.readFileSync(fullPath);

    // Perform text detection
    const [textResult] = await this.googleClient.textDetection(imageBuffer);
    const detections = textResult.textAnnotations || [];

    if (detections.length === 0) {
      throw new Error('No text detected in receipt');
    }

    // Get full text
    const fullText = detections[0]?.description || '';

    // Perform document text detection for better structure
    const [documentResult] = await this.googleClient.documentTextDetection(imageBuffer);
    const pages = documentResult.fullTextAnnotation?.pages || [];

    // Calculate average confidence
    let totalConfidence = 0;
    let confidenceCount = 0;
    pages.forEach((page) => {
      page.blocks?.forEach((block) => {
        if (block.confidence) {
          totalConfidence += block.confidence;
          confidenceCount++;
        }
      });
    });
    const confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    // Extract receipt data
    const extractedData = this.extractReceiptData(fullText);

    return {
      confidence,
      rawData: {
        provider: 'google',
        textAnnotations: JSON.parse(JSON.stringify(detections)),
        fullTextAnnotation: JSON.parse(JSON.stringify(documentResult.fullTextAnnotation)),
      },
      ...extractedData,
    };
  }

  /**
   * Process receipt with AWS Textract
   */
  private async processWithAWS(filePath: string): Promise<OCRResult> {
    if (!this.textractClient) {
      throw new Error('AWS Textract client not initialized');
    }

    const fullPath = path.join(process.cwd(), filePath);
    const imageBuffer = fs.readFileSync(fullPath);

    const command = new AnalyzeExpenseCommand({
      Document: {
        Bytes: imageBuffer,
      },
    });

    const response = await this.textractClient.send(command);
    const expenseDocuments = response.ExpenseDocuments || [];

    if (expenseDocuments.length === 0) {
      throw new Error('No expense data detected in receipt');
    }

    const expenseDoc = expenseDocuments[0];
    const summaryFields = expenseDoc.SummaryFields || [];

    // Calculate average confidence
    let totalConfidence = 0;
    let confidenceCount = 0;
    summaryFields.forEach((field) => {
      if (field.ValueDetection?.Confidence) {
        totalConfidence += field.ValueDetection.Confidence / 100;
        confidenceCount++;
      }
    });
    const confidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    // Extract data from summary fields
    const extractedData = this.extractAWSTextractData(summaryFields);

    return {
      confidence,
      rawData: {
        provider: 'aws',
        expenseDocuments: JSON.parse(JSON.stringify(expenseDocuments)),
      },
      ...extractedData,
    };
  }

  /**
   * Extract receipt data from text (for Google Cloud Vision)
   */
  private extractReceiptData(text: string): Partial<OCRResult> {
    const result: Partial<OCRResult> = {};

    // Extract merchant name (usually first line or near "STORE" keyword)
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length > 0) {
      // Try to find merchant in first few lines
      result.merchantName = lines[0].trim();
    }

    // Extract total amount (look for patterns like "TOTAL", "AMOUNT", etc.)
    const totalRegex = /(?:total|amount|sum)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const totalMatch = text.match(totalRegex);
    if (totalMatch && totalMatch[1]) {
      const amount = parseFloat(totalMatch[1].replace(/,/g, ''));
      result.totalAmount = new Decimal(amount);
    }

    // Extract currency (look for currency symbols or codes)
    const currencyMatch = text.match(/\$|USD|EUR|GBP|CAD/i);
    if (currencyMatch) {
      const currencyMap: Record<string, string> = {
        $: 'USD',
        USD: 'USD',
        EUR: 'EUR',
        GBP: 'GBP',
        CAD: 'CAD',
      };
      result.currency = currencyMap[currencyMatch[0].toUpperCase()] || 'USD';
    }

    // Extract date
    const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      try {
        result.receiptDate = new Date(dateMatch[0]);
      } catch (error) {
        logger.warn('Error parsing receipt date:', error);
      }
    }

    // Extract tax
    const taxRegex = /(?:tax|vat|gst)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const taxMatch = text.match(taxRegex);
    if (taxMatch && taxMatch[1]) {
      const tax = parseFloat(taxMatch[1].replace(/,/g, ''));
      result.tax = new Decimal(tax);
    }

    // Extract tip
    const tipRegex = /(?:tip|gratuity)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const tipMatch = text.match(tipRegex);
    if (tipMatch && tipMatch[1]) {
      const tip = parseFloat(tipMatch[1].replace(/,/g, ''));
      result.tip = new Decimal(tip);
    }

    // Extract subtotal
    const subtotalRegex = /(?:subtotal|sub-total)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i;
    const subtotalMatch = text.match(subtotalRegex);
    if (subtotalMatch && subtotalMatch[1]) {
      const subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));
      result.subtotal = new Decimal(subtotal);
    }

    return result;
  }

  /**
   * Extract data from AWS Textract summary fields
   */
  private extractAWSTextractData(
    summaryFields: Array<{ Type?: { Text?: string }; ValueDetection?: { Text?: string } }>
  ): Partial<OCRResult> {
    const result: Partial<OCRResult> = {};

    summaryFields.forEach((field) => {
      const type = field.Type?.Text?.toLowerCase();
      const value = field.ValueDetection?.Text;

      if (!type || !value) return;

      switch (type) {
        case 'vendor_name':
        case 'merchant':
          result.merchantName = value;
          break;
        case 'total':
        case 'amount_paid':
          result.totalAmount = new Decimal(parseFloat(value.replace(/[^0-9.]/g, '')));
          break;
        case 'tax':
          result.tax = new Decimal(parseFloat(value.replace(/[^0-9.]/g, '')));
          break;
        case 'subtotal':
          result.subtotal = new Decimal(parseFloat(value.replace(/[^0-9.]/g, '')));
          break;
        case 'invoice_receipt_date':
        case 'date':
          try {
            result.receiptDate = new Date(value);
          } catch (error) {
            logger.warn('Error parsing receipt date from Textract:', error);
          }
          break;
      }
    });

    // Set currency to USD by default for AWS Textract
    result.currency = 'USD';

    return result;
  }

  /**
   * Validate OCR result meets confidence threshold
   */
  isConfidenceAcceptable(confidence: number): boolean {
    return confidence >= this.confidenceThreshold;
  }
}

export const ocrService = new OCRService();
