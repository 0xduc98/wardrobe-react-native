/**
 * Authentication Types
 * Based on API_DOCUMENTATION.md authentication section
 */

export interface User {
  id: number | string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  expires_in: number; // seconds (900 = 15 minutes)
  refresh_token: string;
  refresh_expires_in: number; // seconds (2592000 = 30 days)
  token_type: 'Bearer';
}

export interface StoredTokenData {
  access_token: string;
  refresh_token: string;
  access_token_expires_at: number; // Unix timestamp
  refresh_token_expires_at: number; // Unix timestamp
  user_email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
