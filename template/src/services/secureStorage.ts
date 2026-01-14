/**
 * Secure Storage Service
 * Uses react-native-keychain for secure token storage in Keychain (iOS) / Keystore (Android)
 * 
 * Security Rules (from feature spec):
 * - NEVER store tokens in AsyncStorage/SharedPreferences
 * - NEVER log tokens (redacted in debug logs)
 * - ALWAYS use secure storage (Keychain/Keystore)
 */

import * as Keychain from 'react-native-keychain';

import type { StoredTokenData } from '@/types/auth';

const SERVICE_NAME = 'com.wardrobe.auth';
const TOKEN_KEY = 'auth_tokens';

export const SecureStorage = {
  /**
   * Store authentication tokens securely
   */
  async saveTokens(tokenData: StoredTokenData): Promise<boolean> {
    try {
      const tokenString = JSON.stringify(tokenData);

      const result = await Keychain.setGenericPassword(
        TOKEN_KEY,
        tokenString,
        {
          service: SERVICE_NAME,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
        },
      );

      return Boolean(result);
    } catch (error) {
      console.error('[SecureStorage] Failed to save tokens:', error);
      return false;
    }
  },

  /**
   * Retrieve authentication tokens
   */
  async getTokens(): Promise<StoredTokenData | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });

      if (!credentials) {
        return null;
      }

      const tokenData = JSON.parse(credentials.password) as StoredTokenData;
      return tokenData;
    } catch (error) {
      console.error('[SecureStorage] Failed to get tokens:', error);
      return null;
    }
  },

  /**
   * Clear all stored tokens (logout)
   */
  async clearTokens(): Promise<boolean> {
    try {
      const result = await Keychain.resetGenericPassword({
        service: SERVICE_NAME,
      });
      return result;
    } catch (error) {
      console.error('[SecureStorage] Failed to clear tokens:', error);
      return false;
    }
  },

  /**
   * Check if tokens exist in storage
   */
  async hasTokens(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: SERVICE_NAME,
      });
      return Boolean(credentials);
    } catch (error) {
      console.error('[SecureStorage] Failed to check tokens:', error);
      return false;
    }
  },

  /**
   * Check if access token is expired or close to expiry
   * Returns true if token needs refresh (< 60s until expiry)
   */
  shouldRefreshToken(expiresAt: number): boolean {
    const REFRESH_BUFFER = 60 * 1000; // 60 seconds in milliseconds
    const now = Date.now();
    return now >= expiresAt - REFRESH_BUFFER;
  },

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt;
  },
};
