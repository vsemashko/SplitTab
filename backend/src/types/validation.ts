import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email().toLowerCase();
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const currencySchema = z.string().length(3).toUpperCase();
export const uuidSchema = z.string().uuid();

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100),
  defaultCurrency: currencySchema.optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profilePictureUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  defaultCurrency: currencySchema.optional(),
  timezone: z.string().optional(),
  language: z.string().length(2).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema,
});

// Group validation schemas
export const groupTypeSchema = z.enum([
  'friends',
  'trip',
  'home',
  'couple',
  'event',
  'project',
  'other',
]);

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  groupType: groupTypeSchema.optional(),
  defaultCurrency: currencySchema.optional(),
  simplifyDebts: z.boolean().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  defaultCurrency: currencySchema.optional(),
  simplifyDebts: z.boolean().optional(),
  requireExpenseApproval: z.boolean().optional(),
});

// Group member validation schemas
export const memberRoleSchema = z.enum(['admin', 'member', 'viewer']);

export const addGroupMemberSchema = z.object({
  email: emailSchema,
  role: memberRoleSchema.optional(),
});

// Expense validation schemas
export const expenseCategorySchema = z.enum([
  'food_dining',
  'groceries',
  'transportation',
  'entertainment',
  'utilities',
  'rent',
  'shopping',
  'healthcare',
  'travel',
  'other',
]);

export const splitMethodSchema = z.enum([
  'equal',
  'exact',
  'percentage',
  'shares',
  'item',
]);

export const expenseParticipantSchema = z.object({
  userId: uuidSchema,
  paidAmount: z.number().nonnegative(),
  owedAmount: z.number().nonnegative(),
});

export const createExpenseSchema = z
  .object({
    groupId: uuidSchema.optional(),
    amount: z.number().positive().max(999999.99),
    currency: currencySchema.optional(),
    description: z.string().min(1).max(200),
    category: expenseCategorySchema,
    notes: z.string().max(1000).optional(),
    date: z.coerce.date(),
    splitMethod: splitMethodSchema.optional(),
    splitData: z.record(z.string(), z.any()).optional(),
    participants: z.array(expenseParticipantSchema).min(1),
  })
  .refine(
    (data) => {
      const totalPaid = data.participants.reduce((sum, p) => sum + p.paidAmount, 0);
      return Math.abs(totalPaid - data.amount) < 0.01;
    },
    {
      message: 'Total paid amount must equal expense amount',
      path: ['participants'],
    }
  )
  .refine(
    (data) => {
      const totalOwed = data.participants.reduce((sum, p) => sum + p.owedAmount, 0);
      return Math.abs(totalOwed - data.amount) < 0.01;
    },
    {
      message: 'Total owed amount must equal expense amount',
      path: ['participants'],
    }
  );

export const updateExpenseSchema = z.object({
  amount: z.number().positive().max(999999.99).optional(),
  currency: currencySchema.optional(),
  description: z.string().min(1).max(200).optional(),
  category: expenseCategorySchema.optional(),
  notes: z.string().max(1000).optional(),
  date: z.coerce.date().optional(),
  splitMethod: splitMethodSchema.optional(),
  splitData: z.record(z.string(), z.any()).optional(),
  participants: z.array(expenseParticipantSchema).min(1).optional(),
});

// Settlement validation schemas
export const paymentMethodSchema = z.enum([
  'cash',
  'bank_transfer',
  'venmo',
  'paypal',
  'zelle',
  'cash_app',
  'stripe',
  'other',
]);

export const createSettlementSchema = z
  .object({
    groupId: uuidSchema.optional(),
    payerId: uuidSchema,
    payeeId: uuidSchema,
    amount: z.number().positive().max(999999.99),
    currency: currencySchema.optional(),
    paymentMethod: paymentMethodSchema.optional(),
    referenceNumber: z.string().optional(),
    notes: z.string().max(500).optional(),
    date: z.coerce.date().optional(),
  })
  .refine((data) => data.payerId !== data.payeeId, {
    message: 'Payer and payee must be different',
    path: ['payeeId'],
  });

export const updateSettlementSchema = z.object({
  amount: z.number().positive().max(999999.99).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
});

export const confirmSettlementSchema = z.object({
  confirmed: z.boolean(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const expenseQuerySchema = paginationSchema.extend({
  groupId: uuidSchema.optional(),
  category: expenseCategorySchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
});

export const settlementQuerySchema = paginationSchema.extend({
  groupId: uuidSchema.optional(),
  confirmed: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Type exports
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
export type UpdateSettlementInput = z.infer<typeof updateSettlementSchema>;
export type ConfirmSettlementInput = z.infer<typeof confirmSettlementSchema>;

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type ExpenseQuery = z.infer<typeof expenseQuerySchema>;
export type SettlementQuery = z.infer<typeof settlementQuerySchema>;
