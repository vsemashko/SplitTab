import { PrismaClient, Receipt } from '@prisma/client';
import { ApiError, NotFoundError } from '../middleware/errorHandler';
import { deleteFile } from '../utils/fileUpload';

const prisma = new PrismaClient();

export interface CreateReceiptData {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  uploadedById: string;
  expenseId?: string;
}

export interface UpdateReceiptData {
  expenseId?: string;
  merchantName?: string;
  totalAmount?: number;
  currency?: string;
  receiptDate?: Date;
  tax?: number;
  tip?: number;
  subtotal?: number;
  lineItems?: any;
}

export interface OCRResult {
  merchantName?: string;
  totalAmount?: number;
  currency?: string;
  receiptDate?: Date;
  tax?: number;
  tip?: number;
  subtotal?: number;
  lineItems?: any;
  confidence?: number;
  rawData?: any;
}

export class ReceiptService {
  /**
   * Create a new receipt
   */
  async createReceipt(data: CreateReceiptData): Promise<Receipt> {
    const receipt = await prisma.receipt.create({
      data: {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        thumbnailUrl: data.thumbnailUrl,
        uploadedById: data.uploadedById,
        expenseId: data.expenseId,
        ocrStatus: 'pending',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expense: true,
      },
    });

    return receipt;
  }

  /**
   * Get receipt by ID
   */
  async getReceiptById(id: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id, deletedAt: null },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expense: {
          include: {
            paidBy: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    return receipt;
  }

  /**
   * Get user's receipts
   */
  async getUserReceipts(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ): Promise<{ receipts: Receipt[]; total: number }> {
    const where: any = {
      uploadedById: userId,
      deletedAt: null,
    };

    if (options?.status) {
      where.ocrStatus = options.status;
    }

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          expense: {
            select: {
              id: true,
              description: true,
              amount: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.receipt.count({ where }),
    ]);

    return { receipts, total };
  }

  /**
   * Get expense receipts
   */
  async getExpenseReceipts(expenseId: string): Promise<Receipt[]> {
    const receipts = await prisma.receipt.findMany({
      where: {
        expenseId,
        deletedAt: null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return receipts;
  }

  /**
   * Update receipt
   */
  async updateReceipt(id: string, data: UpdateReceiptData, userId: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Only uploader can update receipt
    if (receipt.uploadedById !== userId) {
      throw new ApiError(403, 'You can only update your own receipts');
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: true,
      },
    });

    return updated;
  }

  /**
   * Update OCR status and results
   */
  async updateOCRResults(id: string, result: OCRResult, status: string, error?: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        ocrStatus: status,
        ocrProcessedAt: new Date(),
        ocrConfidence: result.confidence,
        ocrData: result.rawData,
        ocrError: error,
        merchantName: result.merchantName,
        totalAmount: result.totalAmount,
        currency: result.currency,
        receiptDate: result.receiptDate,
        tax: result.tax,
        tip: result.tip,
        subtotal: result.subtotal,
        lineItems: result.lineItems,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: true,
      },
    });

    return updated;
  }

  /**
   * Attach receipt to expense
   */
  async attachToExpense(receiptId: string, expenseId: string, userId: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Only uploader can attach receipt
    if (receipt.uploadedById !== userId) {
      throw new ApiError(403, 'You can only attach your own receipts');
    }

    // Verify expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId, deletedAt: null },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        expenseId,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        expense: true,
      },
    });

    return updated;
  }

  /**
   * Detach receipt from expense
   */
  async detachFromExpense(receiptId: string, userId: string): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Only uploader can detach receipt
    if (receipt.uploadedById !== userId) {
      throw new ApiError(403, 'You can only detach your own receipts');
    }

    const updated = await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        expenseId: null,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete receipt
   */
  async deleteReceipt(id: string, userId: string): Promise<void> {
    const receipt = await prisma.receipt.findUnique({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Only uploader can delete receipt
    if (receipt.uploadedById !== userId) {
      throw new ApiError(403, 'You can only delete your own receipts');
    }

    // Soft delete
    await prisma.receipt.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Delete physical file
    await deleteFile(receipt.fileUrl);
    if (receipt.thumbnailUrl) {
      await deleteFile(receipt.thumbnailUrl);
    }
  }

  /**
   * Get receipts pending OCR processing
   */
  async getPendingOCRReceipts(limit: number = 10): Promise<Receipt[]> {
    const receipts = await prisma.receipt.findMany({
      where: {
        ocrStatus: 'pending',
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return receipts;
  }

  /**
   * Get OCR statistics
   */
  async getOCRStatistics(userId?: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageConfidence?: number;
  }> {
    const where: any = {
      deletedAt: null,
    };

    if (userId) {
      where.uploadedById = userId;
    }

    const [total, pending, processing, completed, failed, avgConfidence] = await Promise.all([
      prisma.receipt.count({ where }),
      prisma.receipt.count({ where: { ...where, ocrStatus: 'pending' } }),
      prisma.receipt.count({ where: { ...where, ocrStatus: 'processing' } }),
      prisma.receipt.count({ where: { ...where, ocrStatus: 'completed' } }),
      prisma.receipt.count({ where: { ...where, ocrStatus: 'failed' } }),
      prisma.receipt.aggregate({
        where: { ...where, ocrStatus: 'completed', ocrConfidence: { not: null } },
        _avg: {
          ocrConfidence: true,
        },
      }),
    ]);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      averageConfidence: avgConfidence._avg.ocrConfidence || undefined,
    };
  }
}

export const receiptService = new ReceiptService();
