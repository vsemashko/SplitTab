import { z } from 'zod';

export const paymentMethods = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'venmo',
  'paypal',
  'zelle',
  'apple_pay',
  'google_pay',
  'other',
] as const;

export const settlementStatuses = ['pending', 'confirmed', 'cancelled'] as const;

export const createSettlementSchema = z.object({
  groupId: z.string().uuid().optional(),
  payerId: z.string().uuid({
    required_error: 'Payer is required',
  }),
  payeeId: z.string().uuid({
    required_error: 'Payee is required',
  }),
  amount: z
    .number({
      required_error: 'Amount is required',
    })
    .positive('Amount must be positive')
    .max(1000000, 'Amount is too large'),
  paymentMethod: z.enum(paymentMethods).optional(),
  referenceNumber: z
    .string()
    .max(100, 'Reference number is too long')
    .optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  settledAt: z.string().datetime().optional(),
}).refine((data) => data.payerId !== data.payeeId, {
  message: 'Payer and payee must be different',
  path: ['payeeId'],
});

export const updateSettlementSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .max(1000000, 'Amount is too large')
    .optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
  referenceNumber: z
    .string()
    .max(100, 'Reference number is too long')
    .optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
  status: z.enum(settlementStatuses).optional(),
});

export const settlementFilterSchema = z.object({
  status: z.enum(settlementStatuses).optional(),
  groupId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  paymentMethod: z.enum(paymentMethods).optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
export type SettlementFilterInput = z.infer<typeof settlementFilterSchema>;
