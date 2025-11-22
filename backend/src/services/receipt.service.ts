import { PrismaClient, Receipt, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ApiError, NotFoundError } from '../middleware/errorHandler';
import { deleteFile } from '../utils/fileUpload';

const prisma = new PrismaClient();

// Type for receipt with relations
export type ReceiptWithRelations = Prisma.ReceiptGetPayload<{
  include: {
    uploadedBy: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    expense: {
      include: {
        paidBy: {
          select: {
            id: true;
            name: true;
          };
        };
        group: {
          select: {
            id: true;
            name: true;
          };
        };
        participants: {
          select: {
            userId: true;
          };
        };
      };
    };
  };
}>;

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
  confidence: number;
  rawData: any;
  merchantName?: string;
  totalAmount?: Decimal;
  currency?: string;
  receiptDate?: Date;
  tax?: Decimal;
  tip?: Decimal;
  subtotal?: Decimal;
  lineItems?: any[];
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
  async getReceiptById(id: string): Promise<ReceiptWithRelations> {
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
            participants: {
              select: {
                userId: true,
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
  async updateOCRResults(
    id: string,
    result: OCRResult,
    status: string,
    error?: string
  ): Promise<Receipt> {
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

  /**
   * Apply manual corrections to OCR results
   */
  async applyManualCorrection(
    id: string,
    corrections: Partial<OCRResult>,
    userId: string
  ): Promise<Receipt> {
    const receipt = await prisma.receipt.findUnique({
      where: { id, deletedAt: null },
    });

    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    // Only uploader can correct receipt
    if (receipt.uploadedById !== userId) {
      throw new ApiError(403, 'You can only correct your own receipts');
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        merchantName: corrections.merchantName ?? receipt.merchantName,
        totalAmount: corrections.totalAmount ?? receipt.totalAmount,
        currency: corrections.currency ?? receipt.currency,
        receiptDate: corrections.receiptDate ?? receipt.receiptDate,
        tax: corrections.tax ?? receipt.tax,
        tip: corrections.tip ?? receipt.tip,
        subtotal: corrections.subtotal ?? receipt.subtotal,
        lineItems: (corrections.lineItems ?? receipt.lineItems) as any,
        updatedAt: new Date(),
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
        expense: true,
      },
    });

    return updated;
  }

  /**
   * Advanced search/filter receipts
   */
  async advancedSearch(
    userId: string,
    filters: {
      merchantName?: string;
      minAmount?: number;
      maxAmount?: number;
      currency?: string;
      startDate?: Date;
      endDate?: Date;
      ocrStatus?: string;
      expenseId?: string;
      hasExpense?: boolean;
      minConfidence?: number;
      maxConfidence?: number;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ receipts: Receipt[]; total: number }> {
    const where: any = {
      uploadedById: userId,
      deletedAt: null,
    };

    if (filters.merchantName) {
      where.merchantName = {
        contains: filters.merchantName,
        mode: 'insensitive',
      };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.totalAmount = {};
      if (filters.minAmount !== undefined) {
        where.totalAmount.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.totalAmount.lte = filters.maxAmount;
      }
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.startDate !== undefined || filters.endDate !== undefined) {
      where.receiptDate = {};
      if (filters.startDate) {
        where.receiptDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.receiptDate.lte = filters.endDate;
      }
    }

    if (filters.ocrStatus) {
      where.ocrStatus = filters.ocrStatus;
    }

    if (filters.expenseId) {
      where.expenseId = filters.expenseId;
    }

    if (filters.hasExpense !== undefined) {
      where.expenseId = filters.hasExpense ? { not: null } : null;
    }

    if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined) {
      where.ocrConfidence = {};
      if (filters.minConfidence !== undefined) {
        where.ocrConfidence.gte = filters.minConfidence;
      }
      if (filters.maxConfidence !== undefined) {
        where.ocrConfidence.lte = filters.maxConfidence;
      }
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
          expense: { select: { id: true, description: true, amount: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: filters.offset || 0,
        take: filters.limit || 50,
      }),
      prisma.receipt.count({ where }),
    ]);

    return { receipts, total };
  }

  /**
   * Batch retry OCR for multiple receipts
   */
  async batchRetryOCR(
    receiptIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of receiptIds) {
      try {
        const receipt = await prisma.receipt.findUnique({
          where: { id, deletedAt: null },
        });

        if (!receipt) {
          failed++;
          continue;
        }

        // Only uploader can retry OCR
        if (receipt.uploadedById !== userId) {
          failed++;
          continue;
        }

        // Update status to pending for retry
        await prisma.receipt.update({
          where: { id },
          data: {
            ocrStatus: 'pending',
            ocrError: null,
            updatedAt: new Date(),
          },
        });

        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Batch delete receipts
   */
  async batchDelete(
    receiptIds: string[],
    userId: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of receiptIds) {
      try {
        await this.deleteReceipt(id, userId);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Export receipts to JSON
   */
  async exportToJSON(
    userId: string,
    receiptIds?: string[],
    includeLineItems: boolean = false
  ): Promise<any[]> {
    const where: any = {
      uploadedById: userId,
      deletedAt: null,
    };

    if (receiptIds && receiptIds.length > 0) {
      where.id = { in: receiptIds };
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        expense: { select: { id: true, description: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return receipts.map((receipt) => ({
      id: receipt.id,
      merchantName: receipt.merchantName || '',
      totalAmount: receipt.totalAmount?.toString() || '',
      currency: receipt.currency || '',
      receiptDate: receipt.receiptDate?.toISOString() || '',
      tax: receipt.tax?.toString() || '',
      tip: receipt.tip?.toString() || '',
      subtotal: receipt.subtotal?.toString() || '',
      ...(includeLineItems && { lineItems: receipt.lineItems }),
      ocrStatus: receipt.ocrStatus,
      ocrConfidence: receipt.ocrConfidence || 0,
      expenseId: receipt.expenseId || '',
      expenseDescription: receipt.expense?.description || '',
      fileName: receipt.fileName,
      fileUrl: receipt.fileUrl,
      createdAt: receipt.createdAt.toISOString(),
    }));
  }

  /**
   * Export receipts to CSV format
   */
  async exportToCSV(
    userId: string,
    receiptIds?: string[],
    _includeLineItems: boolean = false
  ): Promise<string> {
    const data = await this.exportToJSON(userId, receiptIds, false);

    if (data.length === 0) {
      return 'No receipts to export';
    }

    // CSV headers
    const headers = [
      'ID',
      'Merchant Name',
      'Total Amount',
      'Currency',
      'Receipt Date',
      'Tax',
      'Tip',
      'Subtotal',
      'OCR Status',
      'OCR Confidence',
      'Expense ID',
      'Expense Description',
      'File Name',
      'Created At',
    ];

    // CSV rows
    const rows = data.map((receipt) => [
      receipt.id,
      receipt.merchantName,
      receipt.totalAmount,
      receipt.currency,
      receipt.receiptDate,
      receipt.tax,
      receipt.tip,
      receipt.subtotal,
      receipt.ocrStatus,
      receipt.ocrConfidence,
      receipt.expenseId,
      receipt.expenseDescription,
      receipt.fileName,
      receipt.createdAt,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

export const receiptService = new ReceiptService();
