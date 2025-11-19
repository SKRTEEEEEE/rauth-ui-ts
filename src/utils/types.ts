/**
 * Core types and interfaces for the RAuth SDK
 */

/**
 * OAuth provider types supported by RAuth
 */
export type Provider = 'google' | 'github' | 'facebook';

/**
 * User information returned from the RAuth API
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: Provider;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session information
 */
export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}

/**
 * RAuth SDK configuration
 */
export interface RAuthConfig {
  apiKey: string;
  baseUrl?: string;
  providers?: Provider[];
  autoRefresh?: boolean;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * OAuth authorization response
 */
export interface OAuthResponse {
  authUrl: string;
  state: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
