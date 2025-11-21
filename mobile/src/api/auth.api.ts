/**
 * Authentication API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { ApiResponse, LoginResponse, RegisterData, User } from '@/types';

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<LoginResponse>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  },

  register: async (data: RegisterData): Promise<ApiResponse<LoginResponse>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },

  forgotPassword: async (email: string): Promise<ApiResponse<void>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  resetPassword: async (
    token: string,
    newPassword: string
  ): Promise<ApiResponse<void>> => {
    return await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword,
    });
  },
};
