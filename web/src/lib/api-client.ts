/**
 * API Client for SplitTab
 * Handles all HTTP requests to the backend API
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { APIResponse, PaginatedResponse, APIError } from '@/types';

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const BASE_URL = `${API_URL}/${API_VERSION}`;

// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static TOKEN_EXPIRY_KEY = 'token_expiry';

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string, expiresIn: number): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryDate.toISOString());
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return new Date() >= new Date(expiry);
  }
}

// Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<APIError>) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && originalRequest) {
      const refreshToken = TokenManager.getRefreshToken();

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          TokenManager.setAccessToken(data.accessToken, data.expiresIn);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          TokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      } else {
        // No refresh token, redirect to login
        TokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// API Client class
class APIClient {
  // Generic request method
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    config?: object
  ): Promise<T> {
    try {
      const response = await axiosInstance.request<APIResponse<T>>({
        method,
        url: endpoint,
        data,
        ...config,
      });

      if (response.data.data !== undefined) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Paginated request
  async requestPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    params?: object
  ): Promise<PaginatedResponse<T>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<T>>(endpoint, {
        params: {
          page,
          limit,
          ...params,
        },
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload file
  async upload<T>(endpoint: string, file: File, additionalData?: object): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    try {
      const response = await axiosInstance.post<APIResponse<T>>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.data !== undefined) {
        return response.data.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handler
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as APIError;

      if (apiError?.error) {
        return new Error(apiError.error.message || 'An error occurred');
      }

      if (error.response) {
        return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }

      if (error.request) {
        return new Error('No response received from server');
      }
    }

    return error instanceof Error ? error : new Error('An unknown error occurred');
  }

  // Convenience methods
  get<T>(endpoint: string, config?: object): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  post<T>(endpoint: string, data?: unknown, config?: object): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  put<T>(endpoint: string, data?: unknown, config?: object): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  patch<T>(endpoint: string, data?: unknown, config?: object): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  delete<T>(endpoint: string, config?: object): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

// Export instances
export const apiClient = new APIClient();
export { TokenManager };
export default apiClient;
