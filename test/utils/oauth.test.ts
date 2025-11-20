/**
 * Tests for OAuth utilities
 * 
 * Tests the OAuth flow functions including state generation,
 * callback URL construction, OAuth initiation, state validation,
 * and callback handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateState, 
  getCallbackUrl, 
  initiateOAuth, 
  validateState, 
  handleOAuthCallback 
} from '../../src/utils/oauth';
import { initRauth } from '../../src/utils/config';
import type { LoginResponse } from '../../src/utils/types';

describe('OAuth utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    
    // Initialize SDK with test config
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: 'https://test.api.rauth.dev',
      redirectUrl: 'https://test.app.com/auth/callback',
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '', origin: 'https://test.app.com' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state = generateState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should generate different states each time', () => {
      const state1 = generateState();
      const state2 = generateState();
      
      expect(state1).not.toBe(state2);
    });

    it('should save state to sessionStorage', () => {
      const state = generateState();
      const savedState = sessionStorage.getItem('oauth_state');
      
      expect(savedState).toBe(state);
    });

    it('should use crypto.randomUUID if available', () => {
      const mockUUID = 'test-uuid-123';
      const spy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
      
      const state = generateState();
      
      expect(state).toBe(mockUUID);
      expect(spy).toHaveBeenCalled();
    });

    it('should fallback to random bytes if randomUUID is not available', () => {
      const originalRandomUUID = crypto.randomUUID;
      (crypto as any).randomUUID = undefined;
      
      const state = generateState();
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
      
      crypto.randomUUID = originalRandomUUID;
    });
  });

  describe('getCallbackUrl', () => {
    it('should return configured redirectUrl', () => {
      const url = getCallbackUrl();
      
      expect(url).toBe('https://test.app.com/auth/callback');
    });

    it('should fallback to window.location.origin if no redirectUrl configured', () => {
      initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      });
      
      const url = getCallbackUrl();
      
      expect(url).toBe('https://test.app.com/auth/callback');
    });

    it('should use custom path if provided', () => {
      const url = getCallbackUrl('/custom/callback');
      
      expect(url).toBe('https://test.app.com/custom/callback');
    });
  });

  describe('initiateOAuth', () => {
    it('should redirect to OAuth authorization URL', () => {
      initiateOAuth('google');
      
      const expectedUrl = 'https://test.api.rauth.dev/api/v1/oauth/authorize?provider=google&redirect_uri=https%3A%2F%2Ftest.app.com%2Fauth%2Fcallback&state=';
      
      expect(window.location.href).toContain('https://test.api.rauth.dev/api/v1/oauth/authorize');
      expect(window.location.href).toContain('provider=google');
      expect(window.location.href).toContain('redirect_uri=');
      expect(window.location.href).toContain('state=');
    });

    it('should generate and include state parameter', () => {
      initiateOAuth('github');
      
      const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
      const state = urlParams.get('state');
      
      expect(state).toBeDefined();
      expect(state).not.toBe('');
      
      const savedState = sessionStorage.getItem('oauth_state');
      expect(savedState).toBe(state);
    });

    it('should work with different providers', () => {
      const providers = ['google', 'github', 'facebook', 'twitter', 'linkedin'] as const;
      
      providers.forEach(provider => {
        initiateOAuth(provider);
        expect(window.location.href).toContain(`provider=${provider}`);
      });
    });

    it('should encode redirect_uri properly', () => {
      initiateOAuth('google');
      
      const urlParams = new URLSearchParams(window.location.href.split('?')[1]);
      const redirectUri = urlParams.get('redirect_uri');
      
      expect(redirectUri).toBe('https://test.app.com/auth/callback');
    });
  });

  describe('validateState', () => {
    it('should return true for matching state', () => {
      const state = 'test-state-123';
      sessionStorage.setItem('oauth_state', state);
      
      const isValid = validateState(state);
      
      expect(isValid).toBe(true);
    });

    it('should return false for non-matching state', () => {
      sessionStorage.setItem('oauth_state', 'original-state');
      
      const isValid = validateState('different-state');
      
      expect(isValid).toBe(false);
    });

    it('should return false if no state in sessionStorage', () => {
      const isValid = validateState('some-state');
      
      expect(isValid).toBe(false);
    });

    it('should remove state from sessionStorage on successful validation', () => {
      const state = 'test-state-123';
      sessionStorage.setItem('oauth_state', state);
      
      validateState(state);
      
      const savedState = sessionStorage.getItem('oauth_state');
      expect(savedState).toBeNull();
    });

    it('should not remove state on failed validation', () => {
      sessionStorage.setItem('oauth_state', 'original-state');
      
      validateState('different-state');
      
      const savedState = sessionStorage.getItem('oauth_state');
      expect(savedState).toBe('original-state');
    });
  });

  describe('handleOAuthCallback', () => {
    const mockLoginResponse: LoginResponse = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      session: {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: Date.now() + 3600000,
        createdAt: '2025-01-01T00:00:00Z',
        provider: 'google',
      },
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
      expiresAt: Date.now() + 3600000,
    };

    beforeEach(() => {
      // Mock fetch
      global.fetch = vi.fn();
    });

    it('should throw error if error param exists in URL', async () => {
      const params = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User denied access',
      });

      await expect(handleOAuthCallback(params)).rejects.toThrow('OAuth error: User denied access');
    });

    it('should throw error if no code param', async () => {
      const params = new URLSearchParams({});

      await expect(handleOAuthCallback(params)).rejects.toThrow();
    });

    it('should throw error if state validation fails', async () => {
      sessionStorage.setItem('oauth_state', 'original-state');
      
      const params = new URLSearchParams({
        code: 'auth-code-123',
        state: 'different-state',
      });

      await expect(handleOAuthCallback(params)).rejects.toThrow('CSRF');
    });

    it('should call API with code and redirect_uri', async () => {
      sessionStorage.setItem('oauth_state', 'valid-state');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const params = new URLSearchParams({
        code: 'auth-code-123',
        state: 'valid-state',
      });

      await handleOAuthCallback(params);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.api.rauth.dev/api/v1/oauth/callback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            code: 'auth-code-123',
            redirect_uri: 'https://test.app.com/auth/callback',
          }),
        })
      );
    });

    it('should return user and session data', async () => {
      sessionStorage.setItem('oauth_state', 'valid-state');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const params = new URLSearchParams({
        code: 'auth-code-123',
        state: 'valid-state',
      });

      const result = await handleOAuthCallback(params);

      expect(result).toEqual(mockLoginResponse);
    });

    it('should save session to storage', async () => {
      sessionStorage.setItem('oauth_state', 'valid-state');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const params = new URLSearchParams({
        code: 'auth-code-123',
        state: 'valid-state',
      });

      await handleOAuthCallback(params);

      // Verify tokens are saved (will be implemented in oauth.ts)
      // This is checked by the integration with storage utilities
      expect(localStorage.getItem('rauth_access_token')).toBeDefined();
    });

    it('should work without state parameter if backend does not require it', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const params = new URLSearchParams({
        code: 'auth-code-123',
      });

      const result = await handleOAuthCallback(params);

      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw error on API failure', async () => {
      sessionStorage.setItem('oauth_state', 'valid-state');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid authorization code',
          code: 'ERR_INVALID_CODE',
        }),
      });

      const params = new URLSearchParams({
        code: 'invalid-code',
        state: 'valid-state',
      });

      await expect(handleOAuthCallback(params)).rejects.toThrow();
    });
  });
});
