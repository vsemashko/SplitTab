/**
 * Groups API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import {
  ApiResponse,
  Group,
  GroupStatistics,
  CreateGroupData,
  UpdateGroupData,
  Balance,
  PaginatedResponse,
} from '@/types';

interface AddMemberData {
  userId?: string;
  email?: string;
  role?: 'admin' | 'member';
}

export const groupsApi = {
  /**
   * List all groups for the authenticated user
   */
  list: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PaginatedResponse<Group>>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.LIST, { params });
  },

  /**
   * Create a new group
   */
  create: async (data: CreateGroupData): Promise<ApiResponse<Group>> => {
    return await apiClient.post(API_ENDPOINTS.GROUPS.CREATE, data);
  },

  /**
   * Get group details by ID
   */
  get: async (id: string): Promise<ApiResponse<Group>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.DETAIL(id));
  },

  /**
   * Update a group
   */
  update: async (id: string, data: UpdateGroupData): Promise<ApiResponse<Group>> => {
    return await apiClient.put(API_ENDPOINTS.GROUPS.UPDATE(id), data);
  },

  /**
   * Delete a group
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(API_ENDPOINTS.GROUPS.DELETE(id));
  },

  /**
   * Get group members
   */
  getMembers: async (id: string): Promise<ApiResponse<Group['members']>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.MEMBERS(id));
  },

  /**
   * Add a member to a group
   */
  addMember: async (id: string, data: AddMemberData): Promise<ApiResponse<Group>> => {
    return await apiClient.post(API_ENDPOINTS.GROUPS.ADD_MEMBER(id), data);
  },

  /**
   * Remove a member from a group
   */
  removeMember: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    return await apiClient.delete(API_ENDPOINTS.GROUPS.REMOVE_MEMBER(id, userId));
  },

  /**
   * Update member role (admin/member)
   */
  updateMemberRole: async (
    id: string,
    userId: string,
    role: 'admin' | 'member'
  ): Promise<ApiResponse<Group>> => {
    return await apiClient.patch(API_ENDPOINTS.GROUPS.UPDATE_MEMBER_ROLE(id, userId), { role });
  },

  /**
   * Get group balances
   */
  getBalances: async (id: string): Promise<ApiResponse<Balance[]>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.BALANCES(id));
  },

  /**
   * Get group statistics
   */
  getStatistics: async (id: string): Promise<ApiResponse<GroupStatistics>> => {
    return await apiClient.get(API_ENDPOINTS.GROUPS.STATISTICS(id));
  },
};
