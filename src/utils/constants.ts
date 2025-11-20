/**
 * SDK Constants
 * 
 * This file defines all constants used throughout the RAuth SDK,
 * including default URLs, storage keys, and API endpoints.
 */

import type { ProviderName } from './types';

/**
 * Default base URL for the RAuth backend API
 * In development, you should override this in initRauth() with your local backend URL
 * In production, this will point to the production API (when available)
 * 
 * @example
 * ```typescript
 * // Development
 * initRauth({
 *   apiKey: 'test_key',
 *   baseUrl: 'http://localhost:8080', // Override for local dev
 *   providers: ['google']
 * });
 * 
 * // Production (uses default)
 * initRauth({
 *   apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY!,
 *   // baseUrl will default to production URL
 *   providers: ['google']
 * });
 * ```
 */
export const DEFAULT_BASE_URL = 'https://api.rauth.dev'; // Production URL (future)

/**
 * List of all supported OAuth providers
 * These providers are available for authentication
 */
export const SUPPORTED_PROVIDERS: readonly ProviderName[] = [
  'google',
  'github',
  'facebook',
  'twitter',
  'linkedin',
] as const;

/**
 * Default threshold for automatic token refresh (in milliseconds)
 * Tokens will be refreshed when they have 5 minutes or less until expiration
 */
export const DEFAULT_REFRESH_THRESHOLD = 300000; // 5 minutes

/**
 * Default prefix for storage keys
 * All SDK storage keys will be prefixed with this string
 */
export const DEFAULT_STORAGE_PREFIX = 'rauth_';

/**
 * Storage keys for persisting authentication data
 * These keys are used with localStorage, sessionStorage, or cookies
 * Note: These are storage key names, not actual authentication credentials
 */
export const STORAGE_KEYS = {
  /** Storage key name for the access JWT */
  ACCESS_TOKEN: 'rauth_access_jwt',
  
  /** Storage key name for the refresh JWT */
  REFRESH_TOKEN: 'rauth_refresh_jwt',
  
  /** Storage key name for user information */
  USER: 'rauth_user_data',
  
  /** Storage key name for session information */
  SESSION: 'rauth_session_data',
  
  /** Storage key name for JWT expiration timestamp */
  EXPIRES_AT: 'rauth_jwt_expires_at',
} as const;

/**
 * API endpoint paths for the RAuth backend
 * These paths are relative to the base URL
 */
export const API_ENDPOINTS = {
  /** Endpoint to initiate OAuth authorization flow */
  OAUTH_AUTHORIZE: '/api/v1/oauth/authorize',
  
  /** Endpoint to handle OAuth callback */
  OAUTH_CALLBACK: '/api/v1/oauth/callback',
  
  /** Endpoint to refresh access token */
  SESSION_REFRESH: '/api/v1/sessions/refresh',
  
  /** Endpoint to delete/logout a session (requires session ID) */
  SESSION_DELETE: '/api/v1/sessions/:id',
  
  /** Endpoint to get current user information */
  USER_ME: '/api/v1/users/me',
} as const;

/**
 * HTTP status codes used in the SDK
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * Common error codes returned by the API
 * These are error code identifiers, not actual credentials
 */
export const ERROR_CODES = {
  /** Error code for invalid API key */
  INVALID_API_KEY: 'ERR_INVALID_API_KEY',
  
  /** Error code for invalid or expired token */
  INVALID_TOKEN: 'ERR_INVALID_TOKEN',
  
  /** Error code for session not found or expired */
  SESSION_NOT_FOUND: 'ERR_SESSION_NOT_FOUND',
  
  /** Error code for user not found */
  USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  
  /** Error code for OAuth provider error */
  PROVIDER_ERROR: 'ERR_PROVIDER_ERROR',
  
  /** Error code for general authentication error */
  AUTH_ERROR: 'ERR_AUTH_ERROR',
  
  /** Error code for validation error */
  VALIDATION_ERROR: 'ERR_VALIDATION_ERROR',
  
  /** Error code for network error */
  NETWORK_ERROR: 'ERR_NETWORK_ERROR',
} as const;
