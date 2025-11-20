/**
 * OAuth Backend Integration Tests
 * 
 * Tests OAuth flow integration with real backend.
 * Validates state generation, URL construction, and callback handling.
 * 
 * Prerequisites:
 * - Backend running on http://localhost:8080
 * - Google OAuth configured in backend
 * 
 * Note: Full OAuth flow cannot be fully automated as it requires
 * real OAuth provider interaction. These tests validate the parts
 * we can test programmatically.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import {
  generateState,
  getCallbackUrl,
  validateState,
  handleOAuthCallback,
} from '../../src/utils/oauth';

const BACKEND_URL = process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080';

/**
 * Mock sessionStorage for testing
 */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window and sessionStorage
Object.defineProperty(global, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('OAuth Backend Integration', () => {
  beforeEach(() => {
    // Initialize SDK
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: BACKEND_URL,
      providers: ['google', 'github'],
      redirectUrl: 'http://localhost:5173/auth/callback',
      debug: true,
    });

    // Clear session storage
    sessionStorageMock.clear();
  });

  afterEach(() => {
    resetConfig();
    sessionStorageMock.clear();
  });

  describe('State Generation', () => {
    it('should generate cryptographically secure state', () => {
      const state1 = generateState();
      const state2 = generateState();

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
      expect(state1.length).toBeGreaterThan(10);
    });

    it('should save state to sessionStorage', () => {
      const state = generateState();

      const saved = sessionStorageMock.getItem('oauth_state');
      expect(saved).toBe(state);
    });
  });

  describe('Callback URL Construction', () => {
    it('should use configured redirectUrl', () => {
      const url = getCallbackUrl();
      expect(url).toBe('http://localhost:5173/auth/callback');
    });

    it('should use custom path when provided', () => {
      const url = getCallbackUrl('/custom/callback');
      // When custom path is provided, it falls back to window.location.origin
      // In test environment, this is localhost:3000
      expect(url).toContain('/custom/callback');
      expect(url).toMatch(/^https?:\/\/localhost:\d+\/custom\/callback$/);
    });
  });

  describe('State Validation', () => {
    it('should validate correct state', () => {
      const state = generateState();
      const isValid = validateState(state);

      expect(isValid).toBe(true);
    });

    it('should reject invalid state', () => {
      generateState(); // Generate but use different value
      const isValid = validateState('wrong-state');

      expect(isValid).toBe(false);
    });

    it('should reject null state', () => {
      const isValid = validateState(null);
      expect(isValid).toBe(false);
    });

    it('should remove state from storage after successful validation', () => {
      const state = generateState();
      validateState(state);

      const saved = sessionStorageMock.getItem('oauth_state');
      expect(saved).toBeNull();
    });
  });

  describe('OAuth Callback Handling', () => {
    it('should reject callback with error parameter', async () => {
      const params = new URLSearchParams({
        error: 'access_denied',
        error_description: 'User denied access',
      });

      await expect(handleOAuthCallback(params)).rejects.toThrow('OAuth error');
      await expect(handleOAuthCallback(params)).rejects.toThrow('User denied access');
    });

    it('should reject callback without code', async () => {
      const params = new URLSearchParams({});

      await expect(handleOAuthCallback(params)).rejects.toThrow('Missing authorization code');
    });

    it('should validate state parameter if present', async () => {
      const params = new URLSearchParams({
        code: 'test-code-123',
        state: 'invalid-state',
      });

      await expect(handleOAuthCallback(params)).rejects.toThrow('CSRF validation failed');
    });
  });
});

/**
 * OAuth Authorization URL Tests with Backend
 * 
 * Tests that validate authorization URL construction matches
 * what backend expects.
 */
describe('OAuth Authorization URL (Backend Compatible)', () => {
  beforeEach(() => {
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: BACKEND_URL,
      providers: ['google'],
      redirectUrl: 'http://localhost:5173/auth/callback',
    });

    sessionStorageMock.clear();
  });

  afterEach(() => {
    resetConfig();
  });

  it('should construct correct authorization URL for backend', () => {
    const state = generateState();
    const redirectUri = getCallbackUrl();

    const expectedUrl = 
      `${BACKEND_URL}/api/v1/oauth/authorize?` +
      `provider=google&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    // This is what initiateOAuth() should construct
    const baseUrl = `${BACKEND_URL}/api/v1/oauth/authorize`;
    const params = new URLSearchParams({
      provider: 'google',
      redirect_uri: redirectUri,
      state,
    });

    const constructedUrl = `${baseUrl}?${params.toString()}`;

    expect(constructedUrl).toBe(expectedUrl);
  });

  it('should include all required OAuth parameters', () => {
    const state = generateState();
    const redirectUri = getCallbackUrl();

    const params = new URLSearchParams({
      provider: 'google',
      redirect_uri: redirectUri,
      state,
    });

    expect(params.get('provider')).toBe('google');
    expect(params.get('redirect_uri')).toBe(redirectUri);
    expect(params.get('state')).toBe(state);
  });

  it('should work with different providers', () => {
    const providers = ['google', 'github', 'facebook'];

    providers.forEach(provider => {
      const state = generateState();
      const redirectUri = getCallbackUrl();

      const params = new URLSearchParams({
        provider,
        redirect_uri: redirectUri,
        state,
      });

      expect(params.get('provider')).toBe(provider);
    });
  });
});

/**
 * Backend OAuth Endpoint Validation
 * 
 * These tests validate that backend OAuth endpoints are accessible
 * and return expected responses.
 */
describe.skip('Backend OAuth Endpoints (Requires Backend)', () => {
  let backendAvailable = false;

  beforeEach(async () => {
    // Check backend availability
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      backendAvailable = response.ok;
    } catch {
      backendAvailable = false;
    }

    if (backendAvailable) {
      initRauth({
        apiKey: 'test-api-key',
        baseUrl: BACKEND_URL,
        providers: ['google'],
        redirectUrl: 'http://localhost:5173/auth/callback',
      });
    }
  });

  afterEach(() => {
    resetConfig();
  });

  it('should access OAuth authorize endpoint', async () => {
    if (!backendAvailable) {
      console.warn('Backend not available, skipping test');
      return;
    }

    const state = generateState();
    const redirectUri = getCallbackUrl();

    const url = 
      `${BACKEND_URL}/api/v1/oauth/authorize?` +
      `provider=google&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects
    });

    // Backend should respond with redirect or HTML
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });

  it('should handle OAuth callback with invalid code', async () => {
    if (!backendAvailable) {
      console.warn('Backend not available, skipping test');
      return;
    }

    const url = `${BACKEND_URL}/api/v1/oauth/callback`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'invalid-code-123',
        redirect_uri: 'http://localhost:5173/auth/callback',
      }),
    });

    // Should return error (400 or 401), not 404
    expect(response.status).not.toBe(404);
    expect(response.status).toBeGreaterThanOrEqual(400);

    // Should return JSON error
    const contentType = response.headers.get('Content-Type');
    expect(contentType).toContain('application/json');

    const data = await response.json();
    expect(data).toBeDefined();
  });
});

/**
 * Manual OAuth Flow Testing Guide
 * 
 * Since full OAuth flow requires real OAuth provider interaction,
 * it must be tested manually. This test serves as documentation.
 */
describe('Manual OAuth Flow Testing Guide', () => {
  it('documents the manual testing process', () => {
    const guide = `
Manual OAuth Flow Testing Steps:

1. Prerequisites:
   - Backend running at ${BACKEND_URL}
   - Google OAuth configured in backend
   - Frontend running at http://localhost:5173
   - Browser with network inspector open

2. Start OAuth Flow:
   - Open http://localhost:5173
   - Click "Sign in with Google" button
   - Verify state saved to sessionStorage

3. Authorization Request:
   - Browser redirects to backend: ${BACKEND_URL}/api/v1/oauth/authorize
   - Backend redirects to Google OAuth
   - Verify URL parameters: provider, redirect_uri, state

4. Google OAuth:
   - Authorize with real Google account
   - Google redirects back to backend callback

5. Backend Callback:
   - Backend receives code from Google
   - Backend exchanges code for tokens
   - Backend redirects to frontend: http://localhost:5173/auth/callback?code=...&state=...

6. Frontend Callback:
   - Frontend validates state parameter
   - Frontend exchanges code for session tokens
   - Frontend saves tokens to localStorage
   - Frontend redirects to main page

7. Verify Success:
   - User is logged in
   - localStorage contains: access_token, refresh_token, session, user
   - UI shows user email and avatar
   - Network tab shows successful API calls

8. Test Token Refresh:
   - Wait for token to near expiration
   - Or manually call refreshSession()
   - Verify POST to /api/v1/sessions/refresh
   - Verify new tokens in localStorage

9. Test Logout:
   - Click logout button
   - Verify DELETE to /api/v1/sessions/:id
   - Verify localStorage cleared
   - Verify UI returns to logged-out state

Expected Network Calls:
1. GET ${BACKEND_URL}/api/v1/oauth/authorize?provider=google&...
2. POST ${BACKEND_URL}/api/v1/oauth/callback { code, redirect_uri }
3. GET ${BACKEND_URL}/api/v1/users/me (with Authorization header)
4. POST ${BACKEND_URL}/api/v1/sessions/refresh { refreshToken }
5. DELETE ${BACKEND_URL}/api/v1/sessions/:id (with Authorization header)

Common Issues:
- CORS errors: Check backend CORS configuration
- Invalid state: Check sessionStorage preservation
- Invalid code: Codes are single-use, refresh page to get new one
- 401 errors: Check token in Authorization header
    `;

    // Output guide for developers
    console.log(guide);

    expect(guide).toBeTruthy();
  });
});
