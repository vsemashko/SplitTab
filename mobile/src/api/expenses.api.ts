/**
 * Expenses API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { ApiResponse, Expense, PaginatedResponse, ExpenseParticipant } from '@/types';

interface CreateExpenseData {
  groupId: string;
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  date?: string;
  splitMethod: 'equal' | 'exact' | 'percentage' | 'shares';
  paidBy: ExpenseParticipant[];
  splitBetween: ExpenseParticipant[];
  notes?: string;
}

interface UpdateExpenseData {
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
  splitMethod?: 'equal' | 'exact' | 'percentage' | 'shares';
  paidBy?: ExpenseParticipant[];
  splitBetween?: ExpenseParticipant[];
  notes?: string;
}

export const expensesApi = {
  list: async (params?: {
    groupId?: string;
    page?: number;
    pageSize?: number;
    category?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<PaginatedResponse<Expense>>> => {
    return await apiClient.get(API_ENDPOINTS.EXPENSES.LIST, { params });
  },

  create: async (data: CreateExpenseData): Promise<ApiResponse<Expense>> => {
    return await apiClient.post(API_ENDPOINTS.EXPENSES.CREATE, data);
  },

  get: async (id: string): Promise<ApiResponse<Expense>> => {
    return await apiClient.get(API_ENDPOINTS.EXPENSES.DETAIL(id));
  },

  update: async (id: string, data: UpdateExpenseData): Promise<ApiResponse<Expense>> => {
    return await apiClient.patch(API_ENDPOINTS.EXPENSES.UPDATE(id), data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(API_ENDPOINTS.EXPENSES.DELETE(id));
  },

  uploadReceipt: async (
    id: string,
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ receiptUrl: string; ocrData?: any }>> => {
    const formData = new FormData();
    formData.append('receipt', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    } as any);

    return await apiClient.upload(API_ENDPOINTS.EXPENSES.UPLOAD_RECEIPT(id), formData, onProgress);
  },
};
