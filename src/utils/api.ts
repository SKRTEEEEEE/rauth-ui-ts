/**
 * API utilities for making requests to the RAuth backend
 * SSR-compatible with proper error handling
 */

import type { ApiError, OAuthResponse, RefreshTokenResponse, User } from './types';
import { storage } from './storage';

let config = {
  baseUrl: 'https://api.rauth.dev',
  apiKey: '',
};

/**
 * Initialize the API configuration
 */
export function initApi(apiKey: string, baseUrl?: string): void {
  config.apiKey = apiKey;
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }
}

/**
 * Get the current API configuration
 */
export function getApiConfig() {
  return { ...config };
}

/**
 * Build request headers with authentication
 */
function getHeaders(includeAuth = true): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': config.apiKey,
  };

  if (includeAuth) {
    const token = storage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth = true
): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;
  const headers = getHeaders(includeAuth);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

/**
 * Start OAuth authorization flow
 */
export async function initiateOAuth(provider: string): Promise<OAuthResponse> {
  return fetchApi<OAuthResponse>(`/api/v1/oauth/authorize?provider=${provider}`, {}, false);
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<User> {
  return fetchApi<User>('/api/v1/users/me');
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  return fetchApi<RefreshTokenResponse>('/api/v1/sessions/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }, false);
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await fetchApi(`/api/v1/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export const api = {
  initApi,
  getApiConfig,
  initiateOAuth,
  getCurrentUser,
  refreshToken,
  deleteSession,
};
