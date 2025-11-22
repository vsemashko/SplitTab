// Core Types for SplitTab Web App

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  profilePictureUrl?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  defaultCurrency: string;
  timezone: string;
  language: string;
  googleId?: string;
  appleId?: string;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  currency: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: GroupMember[];
  memberCount?: number;
  totalExpenses?: number;
  yourBalance?: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  expenseDate: string;
  category: ExpenseCategory;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  participants?: ExpenseParticipant[];
  payer?: User;
  group?: Group;
}

export interface ExpenseParticipant {
  id: string;
  expenseId: string;
  userId: string;
  share: number;
  shareType: ShareType;
  isPaid: boolean;
  createdAt: string;
  user?: User;
}

export type ShareType = 'equal' | 'percentage' | 'exact' | 'shares';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'other';

export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  currency?: string;
  status: SettlementStatus;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  proofOfPaymentUrl?: string;
  notes?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
  payer?: User;
  payee?: User;
  group?: Group;
}

export type SettlementStatus = 'pending' | 'confirmed' | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'venmo'
  | 'paypal'
  | 'zelle'
  | 'apple_pay'
  | 'google_pay'
  | 'other';

export interface BalanceSummary {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  currency: string;
  byGroup: GroupBalance[];
  byPerson: PersonBalance[];
}

export interface GroupBalance {
  groupId: string;
  groupName: string;
  netBalance: number;
  currency: string;
  members: PersonBalance[];
}

export interface PersonBalance {
  userId: string;
  userName: string;
  userProfilePicture?: string;
  balance: number;
  currency: string;
}

export interface SettlementSuggestion {
  payerId: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency: string;
}

export interface SettlementStats {
  totalSettled: number;
  pendingSettlements: number;
  completedSettlements: number;
  cancelledSettlements: number;
  averageSettlementAmount: number;
  currency: string;
}

export interface Balance {
  userId: string;
  otherUserId: string;
  amount: number;
  currency: string;
  otherUser?: User;
}

// API Response Types

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
}

export interface APIError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
    }>;
  };
  meta?: ResponseMeta;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  meta?: ResponseMeta;
}

// Auth Types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Create/Update Types

export interface GroupCreate {
  name: string;
  description?: string;
  currency: string;
  memberEmails?: string[];
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  imageUrl?: string;
  currency?: string;
}

export interface ExpenseCreate {
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  expenseDate: string;
  category: ExpenseCategory;
  notes?: string;
  participants: Array<{
    userId: string;
    share: number;
    shareType: ShareType;
  }>;
}

export interface ExpenseUpdate {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: ExpenseCategory;
  notes?: string;
}

export interface SettlementCreate {
  groupId?: string;
  payerId: string;
  payeeId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  settledAt?: string;
}

export interface SettlementUpdate {
  amount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  status?: SettlementStatus;
}

export interface UserProfileUpdate {
  name?: string;
  phoneNumber?: string;
  defaultCurrency?: string;
  timezone?: string;
  language?: string;
}
