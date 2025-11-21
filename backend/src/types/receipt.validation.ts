import { z } from 'zod';

/**
 * Validation schema for manual OCR correction
 */
export const manualCorrectionSchema = z.object({
  merchantName: z.string().min(1).max(255).optional(),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  receiptDate: z.string().datetime().or(z.date()).optional(),
  tax: z.number().nonnegative().optional(),
  tip: z.number().nonnegative().optional(),
  subtotal: z.number().positive().optional(),
  lineItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
      })
    )
    .optional(),
});

/**
 * Validation schema for receipt search/filter
 */
export const receiptSearchSchema = z.object({
  merchantName: z.string().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  ocrStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  expenseId: z.string().uuid().optional(),
  hasExpense: z.boolean().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxConfidence: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  sortBy: z
    .enum(['createdAt', 'receiptDate', 'totalAmount', 'merchantName', 'ocrConfidence'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validation schema for batch operations
 */
export const batchReceiptIdsSchema = z.object({
  receiptIds: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * Validation schema for receipt export
 */
export const receiptExportSchema = z.object({
  format: z.enum(['csv', 'json', 'excel']).default('csv'),
  receiptIds: z.array(z.string().uuid()).optional(),
  filters: receiptSearchSchema.optional(),
  includeLineItems: z.boolean().default(false),
});

/**
 * Validation schema for OCR approval
 */
export const ocrApprovalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(500).optional(),
});

export type ManualCorrectionInput = z.infer<typeof manualCorrectionSchema>;
export type ReceiptSearchInput = z.infer<typeof receiptSearchSchema>;
export type BatchReceiptIdsInput = z.infer<typeof batchReceiptIdsSchema>;
export type ReceiptExportInput = z.infer<typeof receiptExportSchema>;
export type OCRApprovalInput = z.infer<typeof ocrApprovalSchema>;
