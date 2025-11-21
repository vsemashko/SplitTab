/**
 * Storage service for secure data persistence
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/utils/constants';

class StorageService {
  /**
   * Secure storage methods (for sensitive data like tokens)
   */
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
  }

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      this.setAccessToken(accessToken),
      this.setRefreshToken(refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    ]);
  }

  /**
   * Regular storage methods (for non-sensitive data)
   */
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async setObject<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  async setUserData(userData: unknown): Promise<void> {
    await this.setObject(STORAGE_KEYS.USER_DATA, userData);
  }

  async getUserData<T>(): Promise<T | null> {
    return await this.getObject<T>(STORAGE_KEYS.USER_DATA);
  }

  async clearUserData(): Promise<void> {
    await this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Clear all app data
   */
  async clearAll(): Promise<void> {
    await Promise.all([this.clearTokens(), AsyncStorage.clear()]);
  }

  /**
   * Theme and preferences
   */
  async setTheme(theme: 'light' | 'dark' | 'auto'): Promise<void> {
    await this.setItem(STORAGE_KEYS.THEME, theme);
  }

  async getTheme(): Promise<'light' | 'dark' | 'auto' | null> {
    return (await this.getItem(STORAGE_KEYS.THEME)) as 'light' | 'dark' | 'auto' | null;
  }

  async setLanguage(language: string): Promise<void> {
    await this.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  async getLanguage(): Promise<string | null> {
    return await this.getItem(STORAGE_KEYS.LANGUAGE);
  }
}

// Need to install @react-native-async-storage/async-storage
export const storage = new StorageService();
