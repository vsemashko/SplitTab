/**
 * Application constants and configuration
 */

// API Configuration
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/v1';
export const WS_URL = process.env.WS_URL || 'ws://localhost:3000';

// App Configuration
export const APP_ENV = process.env.APP_ENV || 'development';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPLOAD_AVATAR: '/users/me/avatar',
  },
  GROUPS: {
    LIST: '/groups',
    CREATE: '/groups',
    DETAIL: (id: string) => `/groups/${id}`,
    UPDATE: (id: string) => `/groups/${id}`,
    DELETE: (id: string) => `/groups/${id}`,
    MEMBERS: (id: string) => `/groups/${id}/members`,
    ADD_MEMBER: (id: string) => `/groups/${id}/members`,
    REMOVE_MEMBER: (id: string, userId: string) => `/groups/${id}/members/${userId}`,
    BALANCES: (id: string) => `/groups/${id}/balances`,
  },
  EXPENSES: {
    LIST: '/expenses',
    CREATE: '/expenses',
    DETAIL: (id: string) => `/expenses/${id}`,
    UPDATE: (id: string) => `/expenses/${id}`,
    DELETE: (id: string) => `/expenses/${id}`,
    UPLOAD_RECEIPT: (id: string) => `/expenses/${id}/receipt`,
  },
  SETTLEMENTS: {
    LIST: '/settlements',
    CREATE: '/settlements',
    DETAIL: (id: string) => `/settlements/${id}`,
    CONFIRM: (id: string) => `/settlements/${id}/confirm`,
    SUGGESTED: (groupId: string) => `/settlements/suggested/${groupId}`,
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  GROUP_MEMBER_ADDED: 'group:member_added',
  GROUP_MEMBER_REMOVED: 'group:member_removed',
  GROUP_UPDATED: 'group:updated',
  EXPENSE_ADDED: 'group:expense_added',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',
  SETTLEMENT_CREATED: 'settlement:created',
  SETTLEMENT_CONFIRMED: 'settlement:confirmed',
  BALANCE_UPDATED: 'balance:updated',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// Categories
export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Utilities',
  'Housing',
  'Healthcare',
  'Travel',
  'Education',
  'Other',
] as const;

// Split Methods
export const SPLIT_METHODS = {
  EQUAL: 'equal',
  EXACT: 'exact',
  PERCENTAGE: 'percentage',
  SHARES: 'shares',
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_GROUP_NAME_LENGTH: 100,
  MAX_EXPENSE_DESCRIPTION_LENGTH: 500,
  MAX_FILE_SIZE_MB: 10,
} as const;

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 seconds
  DEBOUNCE_SEARCH: 300, // 300ms
} as const;
