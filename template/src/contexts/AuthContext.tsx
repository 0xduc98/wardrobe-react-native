/**
 * Authentication Context
 * Manages global auth state and provides auth actions
 * 
 * Features:
 * - Session persistence across app restarts
 * - Auto-refresh tokens (transparent to user)
 * - Secure token storage (Keychain/Keystore)
 * - Error handling for all auth flows
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { AuthApi } from '@/services/authApi';
import { handleApiError } from '@/services/httpClient';
import { SecureStorage } from '@/services/secureStorage';
import type {
  AuthState,
  LoginRequest,
  RegisterRequest,
  StoredTokenData,
  User,
} from '@/types/auth';

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Set error state
   */
  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  /**
   * Register new user
   * Flow: Register → Auto-login → Store tokens → Fetch user
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Step 1: Register user
        const registerResponse = await AuthApi.register(data);
        console.log('[Auth] User registered:', registerResponse.user.email);

        // Step 2: Auto-login with same credentials
        await login(data);
      } catch (error) {
        const message = await handleApiError(error);
        setError(message);
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /**
   * Login existing user
   * Flow: Login → Store tokens → Fetch user → Update state
   */
  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Step 1: Call login endpoint
        const tokens = await AuthApi.login(data);

        // Step 2: Calculate expiry timestamps
        const now = Date.now();
        const tokenData: StoredTokenData = {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          access_token_expires_at: now + tokens.expires_in * 1000,
          refresh_token_expires_at: now + tokens.refresh_expires_in * 1000,
          user_email: data.email,
        };

        // Step 3: Store tokens securely
        await SecureStorage.saveTokens(tokenData);

        // Step 4: Fetch user profile
        const user = await AuthApi.getCurrentUser(tokens.access_token);

        // Step 5: Update state
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log('[Auth] User logged in:', user.email);
      } catch (error) {
        const message = await handleApiError(error);
        setError(message);
        throw error;
      }
    },
    [setError],
  );

  /**
   * Logout user
   * Flow: Call logout endpoint → Clear tokens → Clear state
   * Network error during logout still clears local tokens (user intent is clear)
   */
  const logout = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Get refresh token for server-side revocation
      const tokenData = await SecureStorage.getTokens();

      if (tokenData) {
        try {
          await AuthApi.logout({ refresh_token: tokenData.refresh_token });
          console.log('[Auth] Server-side logout successful');
        } catch (error) {
          // Log error but still clear local tokens
          console.warn('[Auth] Server-side logout failed, clearing local tokens anyway:', error);
        }
      }

      // Always clear local tokens
      await SecureStorage.clearTokens();

      // Update state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      console.log('[Auth] User logged out');
    } catch (error) {
      const message = await handleApiError(error);
      setError(message);
    }
  }, [setError]);

  /**
   * Check authentication status on app start
   * Implements session persistence across app restarts
   */
  const checkAuth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      // Check if tokens exist
      const tokenData = await SecureStorage.getTokens();

      if (!tokenData) {
        // No tokens - user not authenticated
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Check if refresh token is expired
      if (SecureStorage.isRefreshTokenExpired(tokenData.refresh_token_expires_at)) {
        console.warn('[Auth] Refresh token expired, clearing tokens');
        await SecureStorage.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return;
      }

      // Tokens valid - fetch user profile
      try {
        // Note: httpClient will auto-refresh if needed
        const user = await AuthApi.getCurrentUser(tokenData.access_token);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log('[Auth] Session restored:', user.email);
      } catch (error) {
        // Failed to fetch user - clear tokens
        console.error('[Auth] Failed to restore session:', error);
        await SecureStorage.clearTokens();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      const message = await handleApiError(error);
      setError(message);
    }
  }, [setError]);

  /**
   * Check auth on mount (session persistence)
   */
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
