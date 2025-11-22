/**
 * Shared TypeScript types for SplitTab
 * These types are used across web and mobile applications
 */

// User Types
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

// Group Types
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
  role: GroupRole;
  joinedAt: string;
  user?: User;
}

export enum GroupRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

// Expense Types
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

export enum ShareType {
  EQUAL = 'equal',
  PERCENTAGE = 'percentage',
  EXACT = 'exact',
  SHARES = 'shares',
}

export enum ExpenseCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  ENTERTAINMENT = 'entertainment',
  SHOPPING = 'shopping',
  UTILITIES = 'utilities',
  OTHER = 'other',
}

// Settlement Types
export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  status: SettlementStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  settledAt?: string;
  createdAt: string;
  updatedAt: string;
  fromUser?: User;
  toUser?: User;
  group?: Group;
}

export enum SettlementStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  VENMO = 'venmo',
  OTHER = 'other',
}

// Balance Types
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
  error: ErrorDetail;
  meta?: ResponseMeta;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: ErrorDetailItem[];
}

export interface ErrorDetailItem {
  field?: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
  meta?: ResponseMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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

// Create/Update Request Types
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
  participants: ExpenseParticipantCreate[];
}

export interface ExpenseParticipantCreate {
  userId: string;
  share: number;
  shareType: ShareType;
}

export interface ExpenseUpdate {
  description?: string;
  amount?: number;
  expenseDate?: string;
  category?: ExpenseCategory;
  notes?: string;
}

export interface SettlementCreate {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface UserProfileUpdate {
  name?: string;
  phoneNumber?: string;
  defaultCurrency?: string;
  timezone?: string;
  language?: string;
}
