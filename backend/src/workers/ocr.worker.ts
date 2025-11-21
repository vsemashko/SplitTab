import 'dotenv/config';
import { Job } from 'bull';
import { ocrQueue, OCRJobData } from '../queues/ocr.queue';
import { ocrService } from '../services/ocr.service';
import { receiptService } from '../services/receipt.service';
import { notificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

const CONCURRENCY = parseInt(process.env.OCR_QUEUE_CONCURRENCY || '5', 10);

/**
 * Process OCR job
 */
async function processOCRJob(job: Job<OCRJobData>): Promise<void> {
  const { receiptId, filePath } = job.data;

  logger.info(`Processing OCR for receipt ${receiptId}, attempt ${job.attemptsMade + 1}`);

  try {
    // Update receipt status to processing
    await receiptService.updateOCRResults(receiptId, { confidence: 0, rawData: null }, 'processing');

    // Process receipt with OCR service
    const ocrResult = await ocrService.processReceipt(filePath);

    // Check confidence threshold
    const isConfident = ocrService.isConfidenceAcceptable(ocrResult.confidence);

    if (!isConfident) {
      logger.warn(
        `OCR confidence ${ocrResult.confidence} below threshold for receipt ${receiptId}`
      );
    }

    // Update receipt with OCR results
    const receipt = await receiptService.updateOCRResults(receiptId, ocrResult, 'completed');

    logger.info(
      `OCR completed for receipt ${receiptId} with confidence ${ocrResult.confidence}`
    );

    // Log extracted data summary
    if (ocrResult.merchantName || ocrResult.totalAmount) {
      logger.info(
        `Extracted data - Merchant: ${ocrResult.merchantName || 'N/A'}, ` +
          `Total: ${ocrResult.totalAmount || 'N/A'} ${ocrResult.currency || ''}`
      );
    }

    // Send success notification
    try {
      await notificationService.notifyReceiptProcessed(
        receipt.uploadedById,
        receiptId,
        ocrResult.merchantName,
        ocrResult.confidence
      );
    } catch (notifError) {
      logger.error('Error sending OCR success notification:', notifError);
    }
  } catch (error: any) {
    logger.error(`Error processing OCR for receipt ${receiptId}:`, error);

    // Update receipt with error status if this is the last attempt
    if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
      const receipt = await receiptService.updateOCRResults(
        receiptId,
        { confidence: 0, rawData: null },
        'failed',
        error.message || 'OCR processing failed'
      );
      logger.error(`OCR failed permanently for receipt ${receiptId} after all retries`);

      // Send failure notification
      try {
        await notificationService.notifyReceiptOCRFailed(
          receipt.uploadedById,
          receiptId,
          error.message
        );
      } catch (notifError) {
        logger.error('Error sending OCR failure notification:', notifError);
      }
    }

    throw error; // Re-throw to trigger Bull retry mechanism
  }
}

/**
 * Start OCR worker
 */
async function startWorker() {
  logger.info(`Starting OCR worker with concurrency: ${CONCURRENCY}`);

  // Process jobs from queue
  ocrQueue.process(CONCURRENCY, processOCRJob);

  // Worker event handlers
  ocrQueue.on('error', (error) => {
    logger.error('OCR Worker error:', error);
  });

  ocrQueue.on('failed', async (job, error) => {
    logger.error(`Job ${job.id} failed:`, error);

    // If all retries exhausted, update receipt status and send notification
    if (job.attemptsMade >= (job.opts.attempts || 3)) {
      try {
        const receipt = await receiptService.updateOCRResults(
          job.data.receiptId,
          { confidence: 0, rawData: null },
          'failed',
          error.message
        );

        // Send failure notification
        try {
          await notificationService.notifyReceiptOCRFailed(
            receipt.uploadedById,
            job.data.receiptId,
            error.message
          );
        } catch (notifError) {
          logger.error('Error sending OCR failure notification:', notifError);
        }
      } catch (updateError) {
        logger.error('Error updating receipt after job failure:', updateError);
      }
    }
  });

  logger.info('OCR worker started successfully');
  logger.info('Press Ctrl+C to stop the worker');
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info('Shutting down OCR worker...');

  try {
    await ocrQueue.close();
    logger.info('OCR worker stopped gracefully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the worker
startWorker().catch((error) => {
  logger.error('Error starting OCR worker:', error);
  process.exit(1);
});
