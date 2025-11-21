/**
 * Settlements API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { ApiResponse, Settlement, PaginatedResponse } from '@/types';

interface CreateSettlementData {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  referenceNumber?: string;
}

interface SuggestedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
}

export const settlementsApi = {
  list: async (params?: {
    groupId?: string;
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'confirmed';
  }): Promise<ApiResponse<PaginatedResponse<Settlement>>> => {
    return await apiClient.get(API_ENDPOINTS.SETTLEMENTS.LIST, { params });
  },

  create: async (data: CreateSettlementData): Promise<ApiResponse<Settlement>> => {
    return await apiClient.post(API_ENDPOINTS.SETTLEMENTS.CREATE, data);
  },

  get: async (id: string): Promise<ApiResponse<Settlement>> => {
    return await apiClient.get(API_ENDPOINTS.SETTLEMENTS.DETAIL(id));
  },

  confirm: async (id: string): Promise<ApiResponse<Settlement>> => {
    return await apiClient.post(API_ENDPOINTS.SETTLEMENTS.CONFIRM(id));
  },

  getSuggested: async (groupId: string): Promise<ApiResponse<SuggestedSettlement[]>> => {
    return await apiClient.get(API_ENDPOINTS.SETTLEMENTS.SUGGESTED(groupId));
  },
};
