// Expense types for the mobile app

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  groupId: string;
  paidBy: string;
  splitMethod: 'equal' | 'exact' | 'percentage';
  participants: ExpenseParticipant[];
  notes?: string;
  receiptId?: string;
  createdAt: string;
  updatedAt: string;
  payer?: {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
  group?: {
    id: string;
    name: string;
  };
}

export interface ExpenseParticipant {
  userId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePictureUrl?: string;
  };
}

export interface CreateExpenseInput {
  description: string;
  amount: number;
  currency?: string;
  category: string;
  date: string;
  groupId: string;
  paidBy: string;
  splitMethod: 'equal' | 'exact' | 'percentage';
  participants: {
    userId: string;
    amount?: number;
    percentage?: number;
  }[];
  notes?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string;
}

export interface ExpenseFilters {
  groupId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  paidBy?: string;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
}

export const EXPENSE_CATEGORIES = [
  { value: 'food_dining', label: 'Food & Dining', icon: '🍔' },
  { value: 'rent_utilities', label: 'Rent & Utilities', icon: '🏠' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎉' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'shopping', label: 'Shopping', icon: '🛒' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'bills', label: 'Bills', icon: '📱' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'other', label: 'Other', icon: '💰' },
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['value'];
