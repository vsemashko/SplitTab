/**
 * Groups API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { ApiResponse, Group, Balance, PaginatedResponse } from '@/types';

interface CreateGroupData {
  name: string;
  description?: string;
  currency?: string;
}

interface UpdateGroupData {
  name?: string;
  description?: string;
  currency?: string;
}

interface AddMemberData {
  userId?: string;
  email?: string;
  role?: 'admin' | 'member';
}

export const groupsApi = {
  list: async (params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ApiResponse<PaginatedResponse<Group>>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.LIST, { params });
  },

  create: async (data: CreateGroupData): Promise<ApiResponse<Group>> => {
    return await apiClient.post(API_ENDPOINTS.GROUPS.CREATE, data);
  },

  get: async (id: string): Promise<ApiResponse<Group>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.DETAIL(id));
  },

  update: async (id: string, data: UpdateGroupData): Promise<ApiResponse<Group>> => {
    return await apiClient.patch(API_ENDPOINTS.GROUPS.UPDATE(id), data);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(API_ENDPOINTS.GROUPS.DELETE(id));
  },

  getMembers: async (id: string): Promise<ApiResponse<Group['members']>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.MEMBERS(id));
  },

  addMember: async (id: string, data: AddMemberData): Promise<ApiResponse<void>> => {
    return await apiClient.post(API_ENDPOINTS.GROUPS.ADD_MEMBER(id), data);
  },

  removeMember: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(API_ENDPOINTS.GROUPS.REMOVE_MEMBER(id, userId));
  },

  getBalances: async (id: string): Promise<ApiResponse<Balance[]>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.BALANCES(id));
  },
};
