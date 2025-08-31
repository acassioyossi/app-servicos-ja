/**
 * Secure token storage utilities with encryption
 * Provides encrypted storage for JWT tokens and sensitive data
 */

import CryptoJS from 'crypto-js';

// Environment variables for encryption
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
const STORAGE_PREFIX = 'secure_';

/**
 * Encrypt data using AES encryption
 */
function encrypt(data: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES decryption
 */
function decrypt(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Decryption resulted in empty string');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Secure token storage interface
 */
export interface SecureTokenStorage {
  setToken(key: string, token: string): Promise<void>;
  getToken(key: string): Promise<string | null>;
  removeToken(key: string): Promise<void>;
  clearAllTokens(): Promise<void>;
  hasToken(key: string): Promise<boolean>;
}

/**
 * Browser-based secure token storage
 */
class BrowserSecureStorage implements SecureTokenStorage {
  private getStorageKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }

  async setToken(key: string, token: string): Promise<void> {
    if (!isBrowser()) {
      throw new Error('Browser storage not available');
    }

    try {
      const encryptedToken = encrypt(token);
      const storageKey = this.getStorageKey(key);
      
      // Add timestamp for token expiry tracking
      const tokenData = {
        token: encryptedToken,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(storageKey, JSON.stringify(tokenData));
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store token securely');
    }
  }

  async getToken(key: string): Promise<string | null> {
    if (!isBrowser()) {
      return null;
    }

    try {
      const storageKey = this.getStorageKey(key);
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        return null;
      }

      const tokenData = JSON.parse(storedData);
      
      // Check if token data is valid
      if (!tokenData.token || !tokenData.timestamp) {
        await this.removeToken(key);
        return null;
      }

      // Check if token is too old (optional expiry check)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      if (Date.now() - tokenData.timestamp > maxAge) {
        await this.removeToken(key);
        return null;
      }

      return decrypt(tokenData.token);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      // Remove corrupted token
      await this.removeToken(key);
      return null;
    }
  }

  async removeToken(key: string): Promise<void> {
    if (!isBrowser()) {
      return;
    }

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  async clearAllTokens(): Promise<void> {
    if (!isBrowser()) {
      return;
    }

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async hasToken(key: string): Promise<boolean> {
    const token = await this.getToken(key);
    return token !== null;
  }
}

/**
 * Server-side secure token storage (in-memory for demo)
 * In production, this should use a secure database or cache
 */
class ServerSecureStorage implements SecureTokenStorage {
  private tokens: Map<string, { token: string; timestamp: number }> = new Map();

  async setToken(key: string, token: string): Promise<void> {
    try {
      const encryptedToken = encrypt(token);
      this.tokens.set(key, {
        token: encryptedToken,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Failed to store token on server:', error);
      throw new Error('Failed to store token securely');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      const tokenData = this.tokens.get(key);
      
      if (!tokenData) {
        return null;
      }

      // Check token age
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours for server tokens
      if (Date.now() - tokenData.timestamp > maxAge) {
        this.tokens.delete(key);
        return null;
      }

      return decrypt(tokenData.token);
    } catch (error) {
      console.error('Failed to retrieve token from server:', error);
      this.tokens.delete(key);
      return null;
    }
  }

  async removeToken(key: string): Promise<void> {
    this.tokens.delete(key);
  }

  async clearAllTokens(): Promise<void> {
    this.tokens.clear();
  }

  async hasToken(key: string): Promise<boolean> {
    const token = await this.getToken(key);
    return token !== null;
  }
}

/**
 * Create secure token storage instance
 */
export function createSecureTokenStorage(): SecureTokenStorage {
  return isBrowser() ? new BrowserSecureStorage() : new ServerSecureStorage();
}

/**
 * Default secure token storage instance
 */
export const secureTokenStorage = createSecureTokenStorage();

/**
 * Token storage keys
 */
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SESSION: 'user_session',
  TEMP_TOKEN: 'temp_token'
} as const;

/**
 * Utility functions for common token operations
 */
export const tokenUtils = {
  /**
   * Store access and refresh tokens
   */
  async storeAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await secureTokenStorage.setToken(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) {
      await secureTokenStorage.setToken(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string | null> {
    return await secureTokenStorage.getToken(TOKEN_KEYS.ACCESS_TOKEN);
  },

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    return await secureTokenStorage.getToken(TOKEN_KEYS.REFRESH_TOKEN);
  },

  /**
   * Clear all authentication tokens
   */
  async clearAuthTokens(): Promise<void> {
    await secureTokenStorage.removeToken(TOKEN_KEYS.ACCESS_TOKEN);
    await secureTokenStorage.removeToken(TOKEN_KEYS.REFRESH_TOKEN);
    await secureTokenStorage.removeToken(TOKEN_KEYS.USER_SESSION);
  },

  /**
   * Check if user has valid tokens
   */
  async hasValidTokens(): Promise<boolean> {
    return await secureTokenStorage.hasToken(TOKEN_KEYS.ACCESS_TOKEN);
  }
};

/**
 * Generate a secure random key for encryption
 * Use this to generate TOKEN_ENCRYPTION_KEY for production
 */
export function generateEncryptionKey(): string {
  return CryptoJS.lib.WordArray.random(256/8).toString();
}