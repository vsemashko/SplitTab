/**
 * Shared API Client for SplitTab
 * Platform-agnostic API client that can be used in both web and mobile
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { APIResponse, PaginatedResponse, APIError } from './types';

export interface APIClientConfig {
  baseURL: string;
  apiVersion?: string;
  timeout?: number;
  getAccessToken?: () => Promise<string | null>;
  onTokenExpired?: () => Promise<void>;
  onError?: (error: Error) => void;
}

export class SplitTabAPIClient {
  private axios: AxiosInstance;
  private config: APIClientConfig;

  constructor(config: APIClientConfig) {
    this.config = {
      apiVersion: 'v1',
      timeout: 30000,
      ...config,
    };

    this.axios = axios.create({
      baseURL: `${this.config.baseURL}/${this.config.apiVersion}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axios.interceptors.request.use(
      async (config) => {
        if (this.config.getAccessToken) {
          const token = await this.config.getAccessToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<APIError>) => {
        if (error.response?.status === 401 && this.config.onTokenExpired) {
          await this.config.onTokenExpired();
        }

        if (this.config.onError) {
          this.config.onError(this.transformError(error));
        }

        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: unknown): Error {
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

  // Generic request method
  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.axios.request<APIResponse<T>>({
      method,
      url: endpoint,
      data,
      ...config,
    });

    if (response.data.data !== undefined) {
      return response.data.data;
    }

    throw new Error('Invalid response format');
  }

  // Paginated request
  async requestPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 20,
    params?: Record<string, unknown>
  ): Promise<PaginatedResponse<T>> {
    const response = await this.axios.get<PaginatedResponse<T>>(endpoint, {
      params: {
        page,
        limit,
        ...params,
      },
    });

    return response.data;
  }

  // Upload file
  async upload<T>(
    endpoint: string,
    file: File | Blob,
    additionalData?: Record<string, unknown>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const response = await this.axios.post<APIResponse<T>>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.data !== undefined) {
      return response.data.data;
    }

    throw new Error('Invalid response format');
  }

  // Convenience methods
  get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('POST', endpoint, data, config);
  }

  put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PUT', endpoint, data, config);
  }

  patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, config);
  }

  delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }
}

// Export factory function
export function createAPIClient(config: APIClientConfig): SplitTabAPIClient {
  return new SplitTabAPIClient(config);
}
