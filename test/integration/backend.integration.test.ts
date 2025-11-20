/**
 * Backend Integration Tests
 * 
 * These tests validate real integration with the RAuth backend.
 * They should be run with a live backend instance.
 * 
 * Prerequisites:
 * - Backend running on http://localhost:8080
 * - Google OAuth configured in backend
 * - CORS enabled for frontend origin
 * 
 * Note: These tests are skipped by default (use describe.skip).
 * To run them, change describe.skip to describe and ensure backend is running.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import { buildUrl, getCurrentUser, refreshSession, deleteSession } from '../../src/utils/api';
import { handleOAuthCallback } from '../../src/utils/oauth';

// Backend base URL for integration tests
const BACKEND_URL = process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080';

/**
 * Helper to check if backend is available
 */
async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Backend Integration Tests
 * 
 * IMPORTANT: These tests are skipped by default.
 * To run them:
 * 1. Start the backend: cd ../rauth-backend-go && go run main.go
 * 2. Ensure Google OAuth is configured
 * 3. Change describe.skip to describe
 * 4. Run: npm test -- backend.integration.test.ts
 */
describe.skip('Backend Integration', () => {
  let backendAvailable = false;

  beforeAll(async () => {
    // Check if backend is available
    backendAvailable = await isBackendAvailable();

    if (!backendAvailable) {
      console.warn('⚠️  Backend not available. Skipping integration tests.');
      console.warn(`   Please start backend at ${BACKEND_URL}`);
      return;
    }

    // Initialize SDK with real backend
    initRauth({
      apiKey: 'test-api-key-integration',
      baseUrl: BACKEND_URL,
      providers: ['google', 'github'],
      debug: true,
    });
  });

  afterAll(() => {
    // Reset config after tests
    resetConfig();
  });

  describe('Backend Connectivity', () => {
    it('should connect to backend health endpoint', async () => {
      if (!backendAvailable) return;

      const response = await fetch(`${BACKEND_URL}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('healthy');
    });

    it('should build correct API URLs', () => {
      if (!backendAvailable) return;

      const url = buildUrl('/api/v1/users/me');
      expect(url).toBe(`${BACKEND_URL}/api/v1/users/me`);
    });
  });

  describe('OAuth Endpoints', () => {
    it('should return OAuth authorize URL', async () => {
      if (!backendAvailable) return;

      const authorizeUrl = buildUrl('/api/v1/oauth/authorize');
      const testUrl = `${authorizeUrl}?provider=google&redirect_uri=http://localhost:5173/auth/callback&state=test-state`;

      // Try to fetch (should redirect or return HTML)
      const response = await fetch(testUrl, {
        method: 'GET',
        redirect: 'manual', // Don't follow redirects
      });

      // Backend should respond (either redirect or HTML)
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(500);
    });

    it('should validate OAuth callback endpoint exists', async () => {
      if (!backendAvailable) return;

      const callbackUrl = buildUrl('/api/v1/oauth/callback');

      // Try POST without code (should return error, not 404)
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '', // Invalid code
          redirect_uri: 'http://localhost:5173/auth/callback',
        }),
      });

      // Should not be 404 (endpoint exists)
      expect(response.status).not.toBe(404);

      // Should be 400 or similar (bad request)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Session Endpoints', () => {
    it('should validate session refresh endpoint exists', async () => {
      if (!backendAvailable) return;

      const refreshUrl = buildUrl('/api/v1/sessions/refresh');

      // Try POST with invalid token (should return error, not 404)
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'invalid-token',
        }),
      });

      // Should not be 404 (endpoint exists)
      expect(response.status).not.toBe(404);

      // Should be 401 or similar (unauthorized)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    it('should validate session delete endpoint exists', async () => {
      if (!backendAvailable) return;

      const deleteUrl = buildUrl('/api/v1/sessions/test-session-id');

      // Try DELETE with invalid session (should return error, not 404)
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer invalid-token' },
      });

      // Should not be 404 (endpoint exists)
      expect(response.status).not.toBe(404);

      // Should be 401 or similar (unauthorized)
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('User Endpoints', () => {
    it('should validate users/me endpoint exists', async () => {
      if (!backendAvailable) return;

      const userMeUrl = buildUrl('/api/v1/users/me');

      // Try GET without auth (should return 401, not 404)
      const response = await fetch(userMeUrl, {
        method: 'GET',
      });

      // Should not be 404 (endpoint exists)
      expect(response.status).not.toBe(404);

      // Should be 401 (unauthorized)
      expect(response.status).toBe(401);
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from frontend origin', async () => {
      if (!backendAvailable) return;

      const testUrl = buildUrl('/api/v1/oauth/authorize');

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Origin': 'http://localhost:5173',
        },
      });

      // Check CORS headers are present
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');

      // Should either allow specific origin or wildcard
      expect(corsHeader).toBeTruthy();
      expect(
        corsHeader === 'http://localhost:5173' ||
        corsHeader === '*'
      ).toBe(true);
    });

    it('should handle OPTIONS preflight requests', async () => {
      if (!backendAvailable) return;

      const testUrl = buildUrl('/api/v1/sessions/refresh');

      const response = await fetch(testUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });

      // Should respond to OPTIONS
      expect(response.status).toBe(204);

      // Should have CORS headers
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Headers')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format for invalid requests', async () => {
      if (!backendAvailable) return;

      const callbackUrl = buildUrl('/api/v1/oauth/callback');

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '', // Invalid
        }),
      });

      expect(response.status).toBeGreaterThanOrEqual(400);

      // Backend should return JSON error
      const contentType = response.headers.get('Content-Type');
      expect(contentType).toContain('application/json');

      const errorData = await response.json();

      // Should have error structure
      expect(errorData).toHaveProperty('message');
      // Backend might use 'error' or 'message' field
      const hasErrorField = 'error' in errorData || 'message' in errorData;
      expect(hasErrorField).toBe(true);
    });
  });
});

/**
 * Manual OAuth Flow Test (for documentation)
 * 
 * This describes the manual testing process for OAuth flow.
 * Cannot be automated as it requires real OAuth provider interaction.
 * 
 * Steps:
 * 1. Start backend: cd ../rauth-backend-go && go run main.go
 * 2. Start frontend: npm run dev (in examples/basic-react)
 * 3. Open browser: http://localhost:5173
 * 4. Click "Continue with Google"
 * 5. Verify redirect to backend OAuth authorize endpoint
 * 6. Backend redirects to Google OAuth
 * 7. Authorize with real Google account
 * 8. Google redirects to backend callback
 * 9. Backend processes OAuth, creates session, redirects to frontend
 * 10. Frontend handles callback, saves tokens, shows user info
 * 
 * Expected results:
 * - User is logged in
 * - localStorage contains access_token, refresh_token, session
 * - UI shows user email and profile
 * - Network tab shows successful API calls
 * 
 * Test refresh:
 * - Wait ~5 minutes or manually trigger
 * - Verify POST to /api/v1/sessions/refresh
 * - Verify new tokens in localStorage
 * 
 * Test logout:
 * - Click logout button
 * - Verify DELETE to /api/v1/sessions/:id
 * - Verify localStorage cleared
 * - Verify UI shows login state
 */
describe('Manual OAuth Flow (Documentation)', () => {
  it('should be tested manually following OAuth flow steps', () => {
    // This is a placeholder for manual testing documentation
    // See comment block above for manual testing steps
    expect(true).toBe(true);
  });
});
