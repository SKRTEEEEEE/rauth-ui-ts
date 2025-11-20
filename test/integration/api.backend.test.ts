/**
 * API Backend Integration Tests
 * 
 * Tests for API utility functions with real backend.
 * Validates that SDK functions work correctly with actual backend responses.
 * 
 * Prerequisites:
 * - Backend running on http://localhost:8080
 * - Google OAuth configured
 * - Valid test tokens (obtained from manual OAuth flow)
 * 
 * Note: These tests require manual setup and are skipped by default.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import {
  buildUrl,
  getAuthHeaders,
  getCurrentUser,
  refreshSession,
  deleteSession,
  handleOAuthCallback as apiHandleOAuthCallback,
} from '../../src/utils/api';
import { setItem, getItem, removeItem } from '../../src/utils/storage';

const BACKEND_URL = process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080';

/**
 * Test configuration
 * 
 * To run these tests with real backend:
 * 1. Obtain valid tokens by doing OAuth flow manually
 * 2. Set ACCESS_TOKEN and REFRESH_TOKEN env vars
 * 3. Change describe.skip to describe
 */
describe.skip('API Backend Integration', () => {
  beforeEach(() => {
    // Initialize SDK
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: BACKEND_URL,
      providers: ['google'],
      debug: true,
    });
  });

  afterEach(() => {
    resetConfig();
    // Clear storage
    removeItem('access_token');
    removeItem('refresh_token');
    removeItem('session');
    removeItem('user');
  });

  describe('buildUrl', () => {
    it('should build correct URLs with backend base URL', () => {
      expect(buildUrl('/api/v1/users/me')).toBe(`${BACKEND_URL}/api/v1/users/me`);
      expect(buildUrl('/api/v1/sessions/refresh')).toBe(`${BACKEND_URL}/api/v1/sessions/refresh`);
      expect(buildUrl('/api/v1/oauth/authorize')).toBe(`${BACKEND_URL}/api/v1/oauth/authorize`);
    });

    it('should handle trailing slashes correctly', () => {
      expect(buildUrl('api/v1/users/me')).toBe(`${BACKEND_URL}/api/v1/users/me`);
      expect(buildUrl('/api/v1/users/me/')).toBe(`${BACKEND_URL}/api/v1/users/me/`);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return headers without Authorization when no token', () => {
      const headers = getAuthHeaders();

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).not.toHaveProperty('Authorization');
    });

    it('should include Authorization header when token exists', () => {
      const testToken = 'test-access-token-123';
      setItem('access_token', testToken);

      const headers = getAuthHeaders();

      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers).toHaveProperty('Authorization', `Bearer ${testToken}`);
    });
  });

  describe('getCurrentUser (with real backend)', () => {
    it('should return 401 when no auth token', async () => {
      // No token set
      await expect(getCurrentUser()).rejects.toThrow();
    });

    it('should return 401 when invalid token', async () => {
      setItem('access_token', 'invalid-token-12345');

      await expect(getCurrentUser()).rejects.toThrow();
    });

    it.skip('should return user data with valid token', async () => {
      // This requires a valid token from real OAuth flow
      // Set ACCESS_TOKEN env var with real token to test
      const validToken = process.env.ACCESS_TOKEN;

      if (!validToken) {
        console.warn('Skipping: No ACCESS_TOKEN env var set');
        return;
      }

      setItem('access_token', validToken);

      const user = await getCurrentUser();

      expect(user).toBeDefined();
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user.email).toContain('@');
    });
  });

  describe('refreshSession (with real backend)', () => {
    it('should reject with invalid refresh token', async () => {
      await expect(refreshSession('invalid-refresh-token')).rejects.toThrow();
    });

    it.skip('should return new tokens with valid refresh token', async () => {
      // This requires a valid refresh token from real OAuth flow
      const validRefreshToken = process.env.REFRESH_TOKEN;

      if (!validRefreshToken) {
        console.warn('Skipping: No REFRESH_TOKEN env var set');
        return;
      }

      const response = await refreshSession(validRefreshToken);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');
      expect(response.accessToken).toBeTruthy();
      expect(response.refreshToken).toBeTruthy();

      // Tokens should be different from original
      expect(response.refreshToken).not.toBe(validRefreshToken);
    });
  });

  describe('deleteSession (with real backend)', () => {
    it('should reject when no auth token', async () => {
      await expect(deleteSession('test-session-id')).rejects.toThrow();
    });

    it('should reject when invalid auth token', async () => {
      setItem('access_token', 'invalid-token');

      await expect(deleteSession('test-session-id')).rejects.toThrow();
    });

    it.skip('should successfully delete session with valid token', async () => {
      // This requires valid token and session ID from real OAuth flow
      const validToken = process.env.ACCESS_TOKEN;
      const sessionId = process.env.SESSION_ID;

      if (!validToken || !sessionId) {
        console.warn('Skipping: No ACCESS_TOKEN or SESSION_ID env var set');
        return;
      }

      setItem('access_token', validToken);

      await expect(deleteSession(sessionId)).resolves.not.toThrow();
    });
  });

  describe('handleOAuthCallback (with real backend)', () => {
    it('should reject when missing code', async () => {
      await expect(apiHandleOAuthCallback('', undefined)).rejects.toThrow();
    });

    it('should reject with invalid code', async () => {
      await expect(apiHandleOAuthCallback('invalid-code-12345', undefined)).rejects.toThrow();
    });

    it.skip('should return login response with valid code', async () => {
      // This requires a valid OAuth code from real flow
      // Very difficult to test automatically as codes are single-use
      const validCode = process.env.OAUTH_CODE;

      if (!validCode) {
        console.warn('Skipping: No OAUTH_CODE env var set');
        return;
      }

      const response = await apiHandleOAuthCallback(validCode, undefined);

      expect(response).toBeDefined();
      expect(response).toHaveProperty('user');
      expect(response).toHaveProperty('session');
      expect(response).toHaveProperty('accessToken');
      expect(response).toHaveProperty('refreshToken');

      expect(response.user.email).toContain('@');
      expect(response.session.id).toBeTruthy();
      expect(response.accessToken).toBeTruthy();
      expect(response.refreshToken).toBeTruthy();
    });
  });

  describe('Error Response Format', () => {
    it('should parse backend error responses correctly', async () => {
      setItem('access_token', 'invalid-token');

      try {
        await getCurrentUser();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toBeTruthy();
      }
    });
  });
});

/**
 * Backend Response Validation Tests
 * 
 * Validates that backend responses match expected TypeScript types.
 * These tests check the contract between backend and SDK.
 */
describe.skip('Backend Response Validation', () => {
  beforeEach(() => {
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: BACKEND_URL,
      providers: ['google'],
    });
  });

  afterEach(() => {
    resetConfig();
  });

  describe('LoginResponse Structure', () => {
    it.skip('should match LoginResponse type from real OAuth', async () => {
      // Requires valid OAuth code
      const validCode = process.env.OAUTH_CODE;

      if (!validCode) {
        console.warn('Skipping: No OAUTH_CODE env var set');
        return;
      }

      const response = await apiHandleOAuthCallback(validCode, undefined);

      // Validate user object
      expect(response.user).toBeDefined();
      expect(typeof response.user.id).toBe('string');
      expect(typeof response.user.email).toBe('string');
      expect(response.user.email).toContain('@');

      // emailVerified might be boolean or undefined
      if ('emailVerified' in response.user) {
        expect(typeof response.user.emailVerified).toBe('boolean');
      }

      // Validate session object
      expect(response.session).toBeDefined();
      expect(typeof response.session.id).toBe('string');
      expect(typeof response.session.userId).toBe('string');
      expect(response.session.userId).toBe(response.user.id);

      // Validate tokens
      expect(typeof response.accessToken).toBe('string');
      expect(typeof response.refreshToken).toBe('string');
      expect(response.accessToken.length).toBeGreaterThan(10);
      expect(response.refreshToken.length).toBeGreaterThan(10);
    });
  });

  describe('User Object Structure', () => {
    it.skip('should match User type from /users/me endpoint', async () => {
      const validToken = process.env.ACCESS_TOKEN;

      if (!validToken) {
        console.warn('Skipping: No ACCESS_TOKEN env var set');
        return;
      }

      setItem('access_token', validToken);

      const user = await getCurrentUser();

      // Required fields
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(user.email).toContain('@');

      // Optional fields (if present, check type)
      if ('name' in user && user.name !== null) {
        expect(typeof user.name).toBe('string');
      }

      if ('picture' in user && user.picture !== null) {
        expect(typeof user.picture).toBe('string');
        // Should be a URL
        expect(user.picture).toMatch(/^https?:\/\//);
      }

      if ('emailVerified' in user && user.emailVerified !== undefined) {
        expect(typeof user.emailVerified).toBe('boolean');
      }

      // Timestamps
      if ('createdAt' in user) {
        expect(typeof user.createdAt).toBe('string');
        // Should be ISO date
        expect(new Date(user.createdAt).toString()).not.toBe('Invalid Date');
      }

      if ('updatedAt' in user) {
        expect(typeof user.updatedAt).toBe('string');
        expect(new Date(user.updatedAt).toString()).not.toBe('Invalid Date');
      }
    });
  });

  describe('RefreshResponse Structure', () => {
    it.skip('should match RefreshResponse type from /sessions/refresh', async () => {
      const validRefreshToken = process.env.REFRESH_TOKEN;

      if (!validRefreshToken) {
        console.warn('Skipping: No REFRESH_TOKEN env var set');
        return;
      }

      const response = await refreshSession(validRefreshToken);

      // Required fields
      expect(typeof response.accessToken).toBe('string');
      expect(typeof response.refreshToken).toBe('string');
      expect(response.accessToken.length).toBeGreaterThan(10);
      expect(response.refreshToken.length).toBeGreaterThan(10);

      // Tokens should be JWTs (3 parts separated by dots)
      expect(response.accessToken.split('.').length).toBe(3);
      expect(response.refreshToken.split('.').length).toBe(3);

      // Optional expiresAt field
      if ('expiresAt' in response && response.expiresAt) {
        expect(typeof response.expiresAt).toBe('string');
        expect(new Date(response.expiresAt).toString()).not.toBe('Invalid Date');
      }
    });
  });
});
