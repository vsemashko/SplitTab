/**
 * Users API
 */
import { apiClient } from './client';
import { API_ENDPOINTS } from '@/utils/constants';
import { ApiResponse, User } from '@/types';

export const usersApi = {
  getMe: async (): Promise<ApiResponse<User>> => {
    return await apiClient.get(API_ENDPOINTS.USERS.ME);
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    return await apiClient.patch(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
  },

  uploadAvatar: async (
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as unknown as Blob);

    return await apiClient.upload(API_ENDPOINTS.USERS.UPLOAD_AVATAR, formData, onProgress);
  },
};
