'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, TokenManager } from '@/lib/api-client';
import type { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);

    try {
      const token = TokenManager.getAccessToken();

      if (token && !TokenManager.isTokenExpired()) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      TokenManager.clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      } as LoginRequest);

      TokenManager.setAccessToken(data.accessToken, data.expiresIn);
      TokenManager.setRefreshToken(data.refreshToken);
      setUser(data.user);

      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const data = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        name,
      } as RegisterRequest);

      TokenManager.setAccessToken(data.accessToken, data.expiresIn);
      TokenManager.setRefreshToken(data.refreshToken);
      setUser(data.user);

      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
      router.push('/auth/login');
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await apiClient.get<User>('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      TokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // In production, this would integrate with Google OAuth
      // For now, we'll redirect to the OAuth endpoint
      const redirectUri = `${window.location.origin}/auth/callback/google`;
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Google OAuth not configured');
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      })}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const loginWithApple = async () => {
    try {
      // In production, this would integrate with Apple Sign-In
      // For now, we'll redirect to the OAuth endpoint
      const redirectUri = `${window.location.origin}/auth/callback/apple`;
      const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;

      if (!clientId) {
        throw new Error('Apple OAuth not configured');
      }

      const authUrl = `https://appleid.apple.com/auth/authorize?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code id_token',
        response_mode: 'form_post',
        scope: 'name email',
      })}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Apple login failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    loginWithGoogle,
    loginWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
