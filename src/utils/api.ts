/**
 * API utilities for RAuth SDK
 * 
 * Provides SSR-safe wrappers for fetch to communicate with the RAuth backend.
 * Handles authentication headers, error handling, and response typing.
 * 
 * All functions use the configuration from initRauth() to determine baseUrl
 * and include the API key in headers automatically.
 */

import { getConfig } from './config';
import { getItem } from './storage';
import type { ApiError, User, RefreshResponse, LoginResponse } from './types';
import { API_ENDPOINTS, ERROR_CODES } from './constants';

/**
 * Build complete URL from endpoint path
 * 
 * Combines the baseUrl from config with the endpoint path,
 * handling trailing/leading slashes correctly.
 * 
 * @param endpoint - API endpoint path (e.g., '/api/v1/users/me')
 * @returns Complete URL
 * 
 * @example
 * ```typescript
 * const url = buildUrl('/api/v1/users/me');
 * // Returns: 'https://api.rauth.dev/api/v1/users/me'
 * ```
 */
export function buildUrl(endpoint: string): string {
  const config = getConfig();
  let baseUrl = config.baseUrl || 'https://api.rauth.dev';

  // Remove trailing slash from baseUrl
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // Ensure endpoint starts with /
  if (endpoint && !endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }

  return `${baseUrl}${endpoint}`;
}

/**
 * Get authentication headers
 * 
 * Constructs headers object with Authorization bearer token (if available)
 * and Content-Type.
 * 
 * @returns Headers object
 * 
 * @example
 * ```typescript
 * const headers = getAuthHeaders();
 * // Returns: { 'Authorization': 'Bearer ...', 'Content-Type': 'application/json' }
 * ```
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get access token from storage
  const accessToken = getItem<string>('access_token');

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * Parse API error from response
 * 
 * Attempts to extract error information from failed response.
 * Creates a standardized ApiError object.
 * 
 * @param response - Failed fetch response
 * @returns ApiError object
 * @internal
 */
async function parseApiError(response: Response): Promise<ApiError> {
  let errorBody: Partial<ApiError> = {};

  try {
    errorBody = await response.json();
  } catch {
    // If JSON parsing fails, use generic error
    errorBody = {};
  }

  return {
    message: errorBody.message || `HTTP ${response.status}: ${response.statusText}`,
    code: errorBody.code || ERROR_CODES.NETWORK_ERROR,
    status: response.status,
    details: errorBody.details,
  };
}

/**
 * Create ApiError from network error
 * 
 * @param error - Original error
 * @returns ApiError object
 * @internal
 */
function createNetworkError(error: unknown): ApiError {
  const message = error instanceof Error ? error.message : 'Unknown network error';

  return {
    message,
    code: ERROR_CODES.NETWORK_ERROR,
    status: 0,
  };
}

/**
 * Generic API request function
 * 
 * Makes HTTP requests to the RAuth backend with proper error handling,
 * authentication headers, and type safety.
 * 
 * @param endpoint - API endpoint path
 * @param method - HTTP method
 * @param body - Request body (optional, will be JSON stringified)
 * @param requiresAuth - Whether to include Authorization header (default: true)
 * @returns Typed response data
 * @throws ApiError on HTTP errors or network failures
 * 
 * @example
 * ```typescript
 * // GET request with auth
 * const user = await apiRequest<User>('/api/v1/users/me', 'GET');
 * 
 * // POST request without auth
 * const response = await apiRequest<OAuthResponse>(
 *   '/api/v1/oauth/authorize',
 *   'POST',
 *   { provider: 'google' },
 *   false
 * );
 * ```
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  requiresAuth: boolean = true
): Promise<T> {
  // Build URL
  const url = buildUrl(endpoint);

  // Prepare headers
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth headers if required
  if (requiresAuth) {
    headers = getAuthHeaders();
  }

  // Prepare fetch options
  const options: RequestInit = {
    method,
    headers,
  };

  // Add body if provided
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  try {
    // Execute fetch
    const response = await fetch(url, options);

    // Check if response is ok
    if (!response.ok) {
      const apiError = await parseApiError(response);
      throw new Error(apiError.message);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    // If it's already our error with message, re-throw
    if (error instanceof Error) {
      throw error;
    }

    // Otherwise, create network error
    const networkError = createNetworkError(error);
    throw new Error(networkError.message);
  }
}

/**
 * Get OAuth authorization URL
 * 
 * Constructs the URL to redirect users for OAuth authorization.
 * 
 * @param provider - OAuth provider name
 * @param state - CSRF state parameter (optional)
 * @returns Authorization URL
 * 
 * @example
 * ```typescript
 * const url = getOAuthAuthorizeUrl('google', 'random_state_123');
 * // Redirect user to this URL
 * window.location.href = url;
 * ```
 */
export function getOAuthAuthorizeUrl(provider: string, state?: string): string {
  const baseUrl = buildUrl(API_ENDPOINTS.OAUTH_AUTHORIZE);
  const params = new URLSearchParams({
    provider,
  });

  if (state) {
    params.append('state', state);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Handle OAuth callback
 * 
 * Exchanges OAuth authorization code for session tokens.
 * 
 * @param code - OAuth authorization code from callback
 * @param state - CSRF state parameter (optional)
 * @returns Login response with user and session data
 * 
 * @example
 * ```typescript
 * const params = new URLSearchParams(window.location.search);
 * const code = params.get('code');
 * const state = params.get('state');
 * 
 * const result = await handleOAuthCallback(code, state);
 * console.log('Logged in as:', result.user.email);
 * ```
 */
export async function handleOAuthCallback(
  code: string,
  state?: string
): Promise<LoginResponse> {
  const body: { code: string; state?: string } = { code };

  if (state) {
    body.state = state;
  }

  return apiRequest<LoginResponse>(API_ENDPOINTS.OAUTH_CALLBACK, 'POST', body, false);
}

/**
 * Get current authenticated user
 * 
 * Fetches user information for the currently authenticated user.
 * Requires a valid access token in storage.
 * 
 * @returns User information
 * @throws Error if not authenticated or token is invalid
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await getCurrentUser();
 *   console.log('User:', user.email);
 * } catch (error) {
 *   console.error('Not authenticated');
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>(API_ENDPOINTS.USER_ME, 'GET', undefined, true);
}

/**
 * Refresh session tokens
 * 
 * Uses a refresh token to obtain new access and refresh tokens.
 * 
 * @param refreshToken - Refresh token from previous session
 * @returns New tokens and expiration
 * 
 * @example
 * ```typescript
 * const oldRefreshToken = storage.getRefreshToken();
 * const newTokens = await refreshSession(oldRefreshToken);
 * 
 * // Update storage
 * storage.setAccessToken(newTokens.accessToken);
 * storage.setRefreshToken(newTokens.refreshToken);
 * ```
 */
export async function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>(
    API_ENDPOINTS.SESSION_REFRESH,
    'POST',
    { refreshToken },
    false
  );
}

/**
 * Delete session (logout)
 * 
 * Invalidates the session on the backend.
 * Should be called before clearing local storage.
 * 
 * @param sessionId - Session ID to delete
 * 
 * @example
 * ```typescript
 * const sessionId = storage.getSessionId();
 * await deleteSession(sessionId);
 * 
 * // Clear local storage
 * storage.clear();
 * ```
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const endpoint = API_ENDPOINTS.SESSION_DELETE.replace(':id', sessionId);
  await apiRequest<void>(endpoint, 'DELETE', undefined, true);
}

/**
 * API utilities object (for easier imports)
 * 
 * @example
 * ```typescript
 * import { api } from 'rauth';
 * 
 * const user = await api.getCurrentUser();
 * ```
 */
export const api = {
  buildUrl,
  getAuthHeaders,
  apiRequest,
  getOAuthAuthorizeUrl,
  handleOAuthCallback,
  getCurrentUser,
  refreshSession,
  deleteSession,
};
