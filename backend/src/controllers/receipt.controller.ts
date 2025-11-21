import { Request, Response, NextFunction } from 'express';
import { receiptService } from '../services/receipt.service';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { addOCRJob } from '../queues/ocr.queue';

export class ReceiptController {
  /**
   * Upload a receipt
   * POST /api/v1/receipts/upload
   */
  async uploadReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
      }

      const { expenseId } = req.body;

      // Create receipt record
      const receipt = await receiptService.createReceipt({
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: req.user.userId,
        expenseId: expenseId || undefined,
      });

      logger.info(`Receipt uploaded: ${receipt.id} by ${req.user.email}`);

      // Trigger OCR processing job
      try {
        await addOCRJob({
          receiptId: receipt.id,
          filePath: receipt.fileUrl,
        });
        logger.info(`OCR job queued for receipt: ${receipt.id}`);
      } catch (queueError) {
        logger.error(`Error queueing OCR job for receipt ${receipt.id}:`, queueError);
        // Don't fail the upload if queue fails - OCR can be retried later
      }

      res.status(201).json({
        success: true,
        data: { receipt },
        message: 'Receipt uploaded successfully. OCR processing will begin shortly.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receipt by ID
   * GET /api/v1/receipts/:id
   */
  async getReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const receipt = await receiptService.getReceiptById(id);

      // Check if user has access (uploader or expense participant)
      if (receipt.uploadedById !== req.user.userId) {
        // TODO: Check if user is participant in the expense
        // For now, only uploader can view
        throw new ApiError(403, 'You do not have permission to view this receipt');
      }

      res.json({
        success: true,
        data: { receipt },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's receipts
   * GET /api/v1/receipts
   */
  async getUserReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { limit, offset, status } = req.query;

      const options: any = {};
      if (limit) options.limit = parseInt(limit as string, 10);
      if (offset) options.offset = parseInt(offset as string, 10);
      if (status) options.status = status as string;

      const result = await receiptService.getUserReceipts(req.user.userId, options);

      res.json({
        success: true,
        data: {
          receipts: result.receipts,
          total: result.total,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get expense receipts
   * GET /api/v1/expenses/:expenseId/receipts
   */
  async getExpenseReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { expenseId } = req.params;

      // TODO: Verify user is participant in expense
      const receipts = await receiptService.getExpenseReceipts(expenseId);

      res.json({
        success: true,
        data: { receipts },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update receipt
   * PUT /api/v1/receipts/:id
   */
  async updateReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const receipt = await receiptService.updateReceipt(id, req.body, req.user.userId);

      logger.info(`Receipt updated: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        data: { receipt },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Attach receipt to expense
   * POST /api/v1/receipts/:id/attach
   */
  async attachToExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;
      const { expenseId } = req.body;

      if (!expenseId) {
        throw new ApiError(400, 'Expense ID is required');
      }

      const receipt = await receiptService.attachToExpense(id, expenseId, req.user.userId);

      logger.info(`Receipt ${id} attached to expense ${expenseId}`);

      res.json({
        success: true,
        data: { receipt },
        message: 'Receipt attached to expense successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detach receipt from expense
   * POST /api/v1/receipts/:id/detach
   */
  async detachFromExpense(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const receipt = await receiptService.detachFromExpense(id, req.user.userId);

      logger.info(`Receipt ${id} detached from expense`);

      res.json({
        success: true,
        data: { receipt },
        message: 'Receipt detached from expense successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete receipt
   * DELETE /api/v1/receipts/:id
   */
  async deleteReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      await receiptService.deleteReceipt(id, req.user.userId);

      logger.info(`Receipt deleted: ${id} by ${req.user.email}`);

      res.json({
        success: true,
        message: 'Receipt deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get OCR statistics
   * GET /api/v1/receipts/statistics/ocr
   */
  async getOCRStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const statistics = await receiptService.getOCRStatistics(req.user.userId);

      res.json({
        success: true,
        data: { statistics },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry OCR processing
   * POST /api/v1/receipts/:id/retry-ocr
   */
  async retryOCR(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { id } = req.params;

      const receipt = await receiptService.getReceiptById(id);

      // Verify ownership
      if (receipt.uploadedById !== req.user.userId) {
        throw new ApiError(403, 'You can only retry OCR for your own receipts');
      }

      // Update status to pending
      await receiptService.updateOCRResults(id, { confidence: 0, rawData: null }, 'pending');

      // Trigger OCR processing job
      await addOCRJob({
        receiptId: id,
        filePath: receipt.fileUrl,
      });

      logger.info(`OCR retry triggered for receipt: ${id}`);

      res.json({
        success: true,
        message: 'OCR processing has been queued',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get queue statistics
   * GET /api/v1/receipts/queue/stats
   */
  async getQueueStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      const { getQueueStats } = await import('../queues/ocr.queue');
      const stats = await getQueueStats();

      res.json({
        success: true,
        data: { queueStats: stats },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const receiptController = new ReceiptController();
