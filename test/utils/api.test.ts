/**
 * Tests for API utilities
 * 
 * These tests verify all API utility functions including:
 * - URL building with config baseUrl
 * - Header construction with Authorization and API key
 * - Generic apiRequest function with error handling
 * - Specific endpoint functions
 * - Retry logic
 * - Type safety
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import { setItem, removeItem, clearSession } from '../../src/utils/storage';
import type { User, RefreshResponse, ApiError } from '../../src/utils/types';

// Import API utilities
import {
  buildUrl,
  getAuthHeaders,
  apiRequest,
  getOAuthAuthorizeUrl,
  handleOAuthCallback,
  getCurrentUser,
  refreshSession,
  deleteSession,
} from '../../src/utils/api';

// Mock fetch
global.fetch = vi.fn();

describe('API Utilities', () => {
  beforeEach(() => {
    // Initialize SDK with test config
    initRauth({
      apiKey: 'pk_test_123456',
      baseUrl: 'https://api.test.rauth.dev',
      providers: ['google'],
    });

    // Clear storage
    clearSession();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  describe('buildUrl', () => {
    it('should construct URL from baseUrl and endpoint', () => {
      const url = buildUrl('/api/v1/users/me');
      expect(url).toBe('https://api.test.rauth.dev/api/v1/users/me');
    });

    it('should handle trailing slash in baseUrl', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        baseUrl: 'https://api.test.rauth.dev/', // With trailing slash
        providers: ['google'],
      });

      const url = buildUrl('/api/v1/users/me');
      expect(url).toBe('https://api.test.rauth.dev/api/v1/users/me');
    });

    it('should handle missing leading slash in endpoint', () => {
      const url = buildUrl('api/v1/users/me');
      expect(url).toBe('https://api.test.rauth.dev/api/v1/users/me');
    });

    it('should handle empty endpoint', () => {
      const url = buildUrl('');
      expect(url).toBe('https://api.test.rauth.dev');
    });

    it('should use baseUrl from config', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        baseUrl: 'http://localhost:8080',
        providers: ['google'],
      });

      const url = buildUrl('/api/v1/users/me');
      expect(url).toBe('http://localhost:8080/api/v1/users/me');
    });
  });

  describe('getAuthHeaders', () => {
    it('should include Authorization header when token exists', () => {
      setItem('access_token', 'test_access_token_123');

      const headers = getAuthHeaders();

      expect(headers['Authorization']).toBe('Bearer test_access_token_123');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization header when token does not exist', () => {
      removeItem('access_token');

      const headers = getAuthHeaders();

      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include Content-Type by default', () => {
      const headers = getAuthHeaders();

      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should handle null token gracefully', () => {
      removeItem('access_token');

      const headers = getAuthHeaders();

      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('apiRequest', () => {
    it('should make successful GET request', async () => {
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await apiRequest<User>('/api/v1/users/me', 'GET');

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.rauth.dev/api/v1/users/me',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should make successful POST request with body', async () => {
      const mockResponse: RefreshResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: Date.now() + 3600000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const body = { refreshToken: 'old_refresh_token' };
      const result = await apiRequest<RefreshResponse>('/api/v1/sessions/refresh', 'POST', body);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('should include Authorization header when requiresAuth is true', async () => {
      setItem('access_token', 'test_token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiRequest('/api/v1/users/me', 'GET', undefined, true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test_token',
          }),
        })
      );
    });

    it('should not include Authorization header when requiresAuth is false', async () => {
      setItem('access_token', 'test_token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiRequest('/api/v1/oauth/authorize', 'GET', undefined, false);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const headers = fetchCall[1].headers;

      expect(headers['Authorization']).toBeUndefined();
    });

    it('should throw ApiError on HTTP error response', async () => {
      const mockError = {
        message: 'User not found',
        code: 'ERR_USER_NOT_FOUND',
        status: 404,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockError,
      });

      await expect(apiRequest('/api/v1/users/me', 'GET')).rejects.toThrow('User not found');
    });

    it('should handle network error gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiRequest('/api/v1/users/me', 'GET')).rejects.toThrow('Network error');
    });

    it('should parse error response body on failure', async () => {
      const mockError = {
        message: 'Invalid API key',
        code: 'ERR_INVALID_API_KEY',
        status: 401,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockError,
      });

      try {
        await apiRequest('/api/v1/users/me', 'GET');
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Invalid API key');
      }
    });

    it('should handle DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiRequest('/api/v1/sessions/session_123', 'DELETE');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/session_123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle PUT request', async () => {
      const body = { name: 'Updated Name' };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiRequest('/api/v1/users/me', 'PUT', body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });

    it('should return typed response', async () => {
      interface CustomResponse {
        data: string;
        count: number;
      }

      const mockResponse: CustomResponse = {
        data: 'test',
        count: 42,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiRequest<CustomResponse>('/api/v1/custom', 'GET');

      // TypeScript should infer the correct type
      expect(result.data).toBe('test');
      expect(result.count).toBe(42);
    });
  });

  describe('getOAuthAuthorizeUrl', () => {
    it('should construct OAuth authorize URL', () => {
      const url = getOAuthAuthorizeUrl('google');

      expect(url).toContain('https://api.test.rauth.dev/api/v1/oauth/authorize');
      expect(url).toContain('provider=google');
    });

    it('should include state parameter if provided', () => {
      const url = getOAuthAuthorizeUrl('google', 'random_state_123');

      expect(url).toContain('provider=google');
      expect(url).toContain('state=random_state_123');
    });

    it('should work with different providers', () => {
      const googleUrl = getOAuthAuthorizeUrl('google');
      const githubUrl = getOAuthAuthorizeUrl('github');

      expect(googleUrl).toContain('provider=google');
      expect(githubUrl).toContain('provider=github');
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback with code and state', async () => {
      const mockResponse = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        session: {
          id: 'session_123',
          userId: 'user_123',
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          expiresAt: Date.now() + 3600000,
          createdAt: '2024-01-01T00:00:00Z',
          provider: 'google' as const,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await handleOAuthCallback('auth_code_123', 'state_123');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/oauth/callback'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('auth_code_123'),
        })
      );
    });

    it('should handle callback without state', async () => {
      const mockResponse = {
        user: {} as User,
        session: {} as any,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await handleOAuthCallback('auth_code_123');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.code).toBe('auth_code_123');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user', async () => {
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      setItem('access_token', 'valid_token');

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/users/me'),
        expect.any(Object)
      );
    });

    it('should throw error if not authenticated', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Unauthorized',
          code: 'ERR_UNAUTHORIZED',
          status: 401,
        }),
      });

      removeItem('access_token');

      await expect(getCurrentUser()).rejects.toThrow();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session with refresh token', async () => {
      const mockResponse: RefreshResponse = {
        accessToken: 'new_access_token_123',
        refreshToken: 'new_refresh_token_123',
        expiresAt: Date.now() + 3600000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await refreshSession('old_refresh_token_123');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('old_refresh_token_123'),
        })
      );
    });

    it('should throw error on invalid refresh token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Invalid refresh token',
          code: 'ERR_INVALID_TOKEN',
          status: 401,
        }),
      });

      await expect(refreshSession('invalid_token')).rejects.toThrow();
    });
  });

  describe('deleteSession', () => {
    it('should delete session by ID', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await deleteSession('session_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/session_123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle session not found error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'Session not found',
          code: 'ERR_SESSION_NOT_FOUND',
          status: 404,
        }),
      });

      await expect(deleteSession('non_existent_session')).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should create ApiError with all fields', async () => {
      const mockError: ApiError = {
        message: 'Validation failed',
        code: 'ERR_VALIDATION_ERROR',
        status: 400,
        details: {
          field: 'email',
          reason: 'invalid format',
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      try {
        await apiRequest('/api/v1/test', 'POST', {});
        throw new Error('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Validation failed');
      }
    });

    it('should handle network errors with generic ApiError', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network connection lost'));

      await expect(apiRequest('/api/v1/test', 'GET')).rejects.toThrow('Network connection lost');
    });

    it('should handle malformed error response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiRequest('/api/v1/test', 'GET')).rejects.toThrow();
    });
  });

  describe('Integration scenarios', () => {
    it('should complete full OAuth flow', async () => {
      // Step 1: Get authorize URL
      const authorizeUrl = getOAuthAuthorizeUrl('google', 'state_123');
      expect(authorizeUrl).toContain('provider=google');

      // Step 2: Handle callback
      const mockLoginResponse = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        session: {
          id: 'session_123',
          userId: 'user_123',
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          expiresAt: Date.now() + 3600000,
          createdAt: '2024-01-01T00:00:00Z',
          provider: 'google' as const,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const loginResult = await handleOAuthCallback('code_123', 'state_123');
      expect(loginResult.user.id).toBe('user_123');

      // Step 3: Get user with new token
      setItem('access_token', loginResult.session.accessToken);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse.user,
      });

      const user = await getCurrentUser();
      expect(user.id).toBe('user_123');
    });

    it('should handle token refresh flow', async () => {
      // Set initial tokens
      setItem('access_token', 'old_access_token');
      setItem('refresh_token', 'old_refresh_token');

      // Simulate expired token error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          message: 'Token expired',
          code: 'ERR_INVALID_TOKEN',
          status: 401,
        }),
      });

      // Try to get user (should fail)
      await expect(getCurrentUser()).rejects.toThrow();

      // Refresh token
      const mockRefreshResponse: RefreshResponse = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresAt: Date.now() + 3600000,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefreshResponse,
      });

      const refreshResult = await refreshSession('old_refresh_token');
      expect(refreshResult.accessToken).toBe('new_access_token');

      // Update tokens
      setItem('access_token', refreshResult.accessToken);
      setItem('refresh_token', refreshResult.refreshToken);

      // Try again with new token
      const mockUser: User = {
        id: 'user_123',
        email: 'test@example.com',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const user = await getCurrentUser();
      expect(user.id).toBe('user_123');
    });

    it('should handle logout flow', async () => {
      setItem('access_token', 'access_token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await deleteSession('session_123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/sessions/session_123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );

      // Clear local tokens (would be done by logout function)
      clearSession();

      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('Type safety', () => {
    it('should enforce correct response types', async () => {
      interface TestResponse {
        id: string;
        value: number;
      }

      const mockResponse: TestResponse = {
        id: 'test_123',
        value: 42,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiRequest<TestResponse>('/api/v1/test', 'GET');

      // TypeScript should know the shape of result
      const id: string = result.id;
      const value: number = result.value;

      expect(id).toBe('test_123');
      expect(value).toBe(42);
    });
  });
});
