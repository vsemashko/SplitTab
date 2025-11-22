import { z } from 'zod';
import type { ShareType, ExpenseCategory } from '@/types';

// Share type validation
export const shareTypeSchema = z.enum(['equal', 'percentage', 'exact', 'shares']);

// Expense category validation
export const expenseCategorySchema = z.enum([
  'food',
  'transport',
  'accommodation',
  'entertainment',
  'shopping',
  'utilities',
  'other',
]);

// Participant validation
export const participantSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  share: z.number().min(0, 'Share must be a positive number'),
  shareType: shareTypeSchema,
});

// Expense creation validation
export const expenseCreateSchema = z
  .object({
    groupId: z.string().min(1, 'Group is required'),
    description: z
      .string()
      .min(1, 'Description is required')
      .min(3, 'Description must be at least 3 characters')
      .max(200, 'Description must not exceed 200 characters'),
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .max(1000000, 'Amount is too large')
      .refine((val) => {
        // Ensure max 2 decimal places
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      }, 'Amount can only have up to 2 decimal places'),
    currency: z
      .string()
      .length(3, 'Currency code must be 3 characters')
      .regex(/^[A-Z]{3}$/, 'Invalid currency code'),
    paidBy: z.string().min(1, 'Payer is required'),
    expenseDate: z.date().max(new Date(), 'Expense date cannot be in the future'),
    category: expenseCategorySchema,
    notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
    participants: z
      .array(participantSchema)
      .min(1, 'At least one participant is required')
      .max(50, 'Too many participants'),
  })
  .refine(
    (data) => {
      // Validate that shares add up based on share type
      if (data.participants.length === 0) return true;

      const firstShareType = data.participants[0].shareType;
      const allSameType = data.participants.every((p) => p.shareType === firstShareType);

      if (!allSameType) {
        return false; // All participants must have the same share type
      }

      // For percentage, total should be 100
      if (firstShareType === 'percentage') {
        const total = data.participants.reduce((sum, p) => sum + p.share, 0);
        return Math.abs(total - 100) < 0.01; // Allow small floating point errors
      }

      // For exact amounts, total should equal expense amount
      if (firstShareType === 'exact') {
        const total = data.participants.reduce((sum, p) => sum + p.share, 0);
        return Math.abs(total - data.amount) < 0.01;
      }

      // For shares and equal, just ensure shares are positive
      return data.participants.every((p) => p.share > 0);
    },
    {
      message: 'Participant shares do not add up correctly',
      path: ['participants'],
    }
  );

export type ExpenseCreateFormData = z.infer<typeof expenseCreateSchema>;

// Expense update validation
export const expenseUpdateSchema = z.object({
  description: z
    .string()
    .min(3, 'Description must be at least 3 characters')
    .max(200, 'Description must not exceed 200 characters')
    .optional(),
  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(1000000, 'Amount is too large')
    .refine((val) => {
      const decimalPlaces = (val.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    }, 'Amount can only have up to 2 decimal places')
    .optional(),
  expenseDate: z.date().max(new Date(), 'Expense date cannot be in the future').optional(),
  category: expenseCategorySchema.optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export type ExpenseUpdateFormData = z.infer<typeof expenseUpdateSchema>;

// Filter validation
export const expenseFilterSchema = z.object({
  groupId: z.string().optional(),
  category: expenseCategorySchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  paidBy: z.string().optional(),
  participantId: z.string().optional(),
  search: z.string().max(100).optional(),
});

export type ExpenseFilterFormData = z.infer<typeof expenseFilterSchema>;

// Sort options
export const expenseSortSchema = z.enum(['date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'group']);

export type ExpenseSortOption = z.infer<typeof expenseSortSchema>;

// Helper functions for split calculations

export function calculateEqualSplit(amount: number, participantCount: number): number {
  if (participantCount === 0) return 0;
  return Math.round((amount / participantCount) * 100) / 100;
}

export function calculatePercentageSplit(amount: number, percentage: number): number {
  return Math.round((amount * (percentage / 100)) * 100) / 100;
}

export function calculateShareSplit(amount: number, share: number, totalShares: number): number {
  if (totalShares === 0) return 0;
  return Math.round((amount * (share / totalShares)) * 100) / 100;
}

export function validateSplitTotal(
  participants: Array<{ share: number; shareType: ShareType }>,
  totalAmount: number
): { valid: boolean; message?: string } {
  if (participants.length === 0) {
    return { valid: false, message: 'At least one participant is required' };
  }

  const shareType = participants[0].shareType;

  // Ensure all participants have the same share type
  if (!participants.every((p) => p.shareType === shareType)) {
    return { valid: false, message: 'All participants must use the same split method' };
  }

  switch (shareType) {
    case 'equal':
      // All shares should be equal
      const equalShare = participants[0].share;
      if (!participants.every((p) => p.share === equalShare)) {
        return { valid: false, message: 'All shares must be equal for equal split' };
      }
      return { valid: true };

    case 'percentage':
      const totalPercentage = participants.reduce((sum, p) => sum + p.share, 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { valid: false, message: 'Percentages must add up to 100%' };
      }
      return { valid: true };

    case 'exact':
      const totalExact = participants.reduce((sum, p) => sum + p.share, 0);
      if (Math.abs(totalExact - totalAmount) > 0.01) {
        return { valid: false, message: 'Exact amounts must add up to total expense' };
      }
      return { valid: true };

    case 'shares':
      // Just ensure all shares are positive
      if (!participants.every((p) => p.share > 0)) {
        return { valid: false, message: 'All shares must be positive' };
      }
      return { valid: true };

    default:
      return { valid: false, message: 'Invalid share type' };
  }
}

// Category helpers
export const categoryIcons: Record<ExpenseCategory, string> = {
  food: '🍽️',
  transport: '🚗',
  accommodation: '🏠',
  entertainment: '🎬',
  shopping: '🛍️',
  utilities: '💡',
  other: '📦',
};

export const categoryLabels: Record<ExpenseCategory, string> = {
  food: 'Food & Dining',
  transport: 'Transportation',
  accommodation: 'Accommodation',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  utilities: 'Utilities',
  other: 'Other',
};

export const shareTypeLabels: Record<ShareType, string> = {
  equal: 'Split Equally',
  percentage: 'By Percentage',
  exact: 'Exact Amounts',
  shares: 'By Shares',
};
