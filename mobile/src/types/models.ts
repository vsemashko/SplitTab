/**
 * Data models and types
 */

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  defaultCurrency: string;
  timezone?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  userId: string;
  user: User;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  createdBy: string;
  createdByUser?: User;
  splitMethod: 'equal' | 'exact' | 'percentage' | 'shares';
  paidBy: ExpenseParticipant[];
  splitBetween: ExpenseParticipant[];
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  userId: string;
  user?: User;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  fromUser?: User;
  toUserId: string;
  toUser?: User;
  amount: number;
  currency: string;
  paymentMethod?: string;
  referenceNumber?: string;
  status: 'pending' | 'confirmed';
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  userId: string;
  user?: User;
  balance: number;
  owes: BalanceDetail[];
  owedBy: BalanceDetail[];
}

export interface BalanceDetail {
  userId: string;
  user?: User;
  amount: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}
