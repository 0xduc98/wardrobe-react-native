/**
 * Authentication API Service
 * Implements all auth endpoints from API_DOCUMENTATION.md
 * 
 * Base URL: http://localhost:5001/api/v1
 * All endpoints use application/json except file uploads
 */

import { instance } from '@/services/instance';
import type {
  AuthTokens,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from '@/types/auth';

const API_PREFIX = 'api/v1';

export const AuthApi = {
  /**
   * POST /api/v1/register
   * Register a new user
   * Rate Limit: 5 requests per minute
   * 
   * Errors:
   * - 400: Missing email or password
   * - 409: Email already registered
   * - 500: Database error
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await instance
      .post(`${API_PREFIX}/register`, { json: data })
      .json<RegisterResponse>();
    return response;
  },

  /**
   * POST /api/v1/login
   * Authenticate user and receive tokens
   * Rate Limit: 10 requests per minute
   * 
   * Errors:
   * - 400: Missing email or password
   * - 401: Invalid credentials
   */
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await instance
      .post(`${API_PREFIX}/login`, { json: data })
      .json<AuthTokens>();
    return response;
  },

  /**
   * POST /api/v1/token/refresh
   * Obtain new access token (+ rotate refresh token)
   * Rate Limit: 20 requests per minute
   * 
   * IMPORTANT: Backend rotates refresh tokens - always store the new one!
   * 
   * Errors:
   * - 400: Missing refresh token
   * - 401: Invalid or expired refresh token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<AuthTokens> {
    const response = await instance
      .post(`${API_PREFIX}/token/refresh`, { json: data })
      .json<AuthTokens>();
    return response;
  },

  /**
   * GET /api/v1/me
   * Get current authenticated user profile
   * Requires: Authorization: Bearer <access_token>
   * 
   * Errors:
   * - 401: Token invalid/expired
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const response = await instance
      .get(`${API_PREFIX}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .json<User>();
    return response;
  },

  /**
   * POST /api/v1/logout
   * Revoke refresh token server-side
   * 
   * Errors:
   * - 400: Missing token
   */
  async logout(data: LogoutRequest): Promise<{ message: string }> {
    const response = await instance
      .post(`${API_PREFIX}/logout`, { json: data })
      .json<{ message: string }>();
    return response;
  },
};
