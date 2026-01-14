/**
 * HTTP Client with Auto-Refresh Interceptor
 * 
 * Implements automatic token refresh logic as per feature spec:
 * - Check access token expiry before each protected request
 * - Auto-refresh if < 60s until expiry
 * - Retry original request with new token
 * - Handle refresh failures gracefully
 * 
 * Request Deduplication:
 * - Only one refresh call in flight at a time
 * - Other requests wait for the result
 */

import type { HTTPError, KyInstance } from 'ky';
import ky from 'ky';

import { AuthApi } from '@/services/authApi';
import { SecureStorage } from '@/services/secureStorage';
import type { AuthTokens, StoredTokenData } from '@/types/auth';

const API_URL = process.env.API_URL ?? 'http://localhost:5001';

/**
 * Global refresh promise for request deduplication
 * Ensures only one refresh call happens at a time
 */
let refreshPromise: Promise<AuthTokens | null> | null = null;

/**
 * Refresh access token using stored refresh token
 * Implements token rotation - stores new refresh token
 */
async function refreshAccessToken(): Promise<AuthTokens | null> {
  try {
    const tokenData = await SecureStorage.getTokens();

    if (!tokenData) {
      console.warn('[HttpClient] No tokens found for refresh');
      return null;
    }

    // Check if refresh token is expired
    if (SecureStorage.isRefreshTokenExpired(tokenData.refresh_token_expires_at)) {
      console.warn('[HttpClient] Refresh token expired');
      await SecureStorage.clearTokens();
      return null;
    }

    // Call refresh endpoint
    const newTokens = await AuthApi.refreshToken({
      refresh_token: tokenData.refresh_token,
    });

    // Calculate expiry timestamps
    const now = Date.now();
    const newTokenData: StoredTokenData = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token, // NEW token (rotation!)
      access_token_expires_at: now + newTokens.expires_in * 1000,
      refresh_token_expires_at: now + newTokens.refresh_expires_in * 1000,
      user_email: tokenData.user_email,
    };

    // Store new tokens
    await SecureStorage.saveTokens(newTokenData);

    console.log('[HttpClient] Token refreshed successfully');
    return newTokens;
  } catch (error) {
    console.error('[HttpClient] Token refresh failed:', error);
    // Clear tokens on refresh failure (forces re-login)
    await SecureStorage.clearTokens();
    return null;
  }
}

/**
 * Get fresh access token (with auto-refresh if needed)
 */
async function getFreshAccessToken(): Promise<string | null> {
  const tokenData = await SecureStorage.getTokens();

  if (!tokenData) {
    return null;
  }

  // Check if token needs refresh (< 60s until expiry)
  if (SecureStorage.shouldRefreshToken(tokenData.access_token_expires_at)) {
    console.log('[HttpClient] Access token needs refresh');

    // Deduplicate refresh calls
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newTokens = await refreshPromise;

    if (!newTokens) {
      return null;
    }

    return newTokens.access_token;
  }

  return tokenData.access_token;
}

/**
 * Create authenticated HTTP client with auto-refresh
 */
export const createAuthenticatedClient = (): KyInstance => {
  return ky.create({
    prefixUrl: API_URL,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    hooks: {
      beforeRequest: [
        async (request) => {
          // Skip auth for public endpoints
          const url = request.url;
          const isPublicEndpoint =
            url.includes('/register') ||
            url.includes('/login') ||
            url.includes('/token/refresh') ||
            url.includes('/health');

          if (isPublicEndpoint) {
            return;
          }

          // Get fresh token (with auto-refresh)
          const accessToken = await getFreshAccessToken();

          if (accessToken) {
            request.headers.set('Authorization', `Bearer ${accessToken}`);
          } else {
            // No token available - let request fail with 401
            console.warn('[HttpClient] No access token available for protected request');
          }
        },
      ],
      afterResponse: [
        async (_request, _options, response) => {
          // Handle 401 errors (token expired during request)
          if (response.status === 401) {
            console.warn('[HttpClient] Received 401, attempting token refresh');

            // Try to refresh token
            const newTokens = await refreshAccessToken();

            if (newTokens) {
              // Retry original request with new token
              const retryRequest = _request.clone();
              retryRequest.headers.set('Authorization', `Bearer ${newTokens.access_token}`);

              console.log('[HttpClient] Retrying request with new token');
              return ky(retryRequest);
            } else {
              // Refresh failed - return original 401
              console.error('[HttpClient] Token refresh failed, cannot retry request');
              return response;
            }
          }

          return response;
        },
      ],
    },
  });
};

/**
 * Default authenticated client instance
 */
export const authClient = createAuthenticatedClient();

/**
 * Handle API errors and extract error message
 */
export async function handleApiError(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'response' in error) {
    const httpError = error as HTTPError;
    try {
      const errorData = await httpError.response.json();
      return errorData.message || errorData.error || 'An error occurred';
    } catch {
      return httpError.response.statusText || 'An error occurred';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}
