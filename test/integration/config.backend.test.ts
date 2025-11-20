/**
 * Configuration Backend Integration Tests
 * 
 * Tests SDK configuration with real backend to ensure
 * proper setup and compatibility.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initRauth, getConfig, resetConfig } from '../../src/utils/config';
import { buildUrl } from '../../src/utils/api';

const BACKEND_URL = process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080';

describe('Configuration for Backend Integration', () => {
  afterEach(() => {
    resetConfig();
  });

  describe('initRauth with backend URL', () => {
    it('should initialize with localhost backend URL', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'],
      });

      expect(config.baseUrl).toBe('http://localhost:8080');
    });

    it('should initialize with production backend URL', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.rauth.dev',
        providers: ['google'],
      });

      expect(config.baseUrl).toBe('https://api.rauth.dev');
    });

    it('should remove trailing slash from backend URL', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'http://localhost:8080/',
        providers: ['google'],
      });

      expect(config.baseUrl).toBe('http://localhost:8080');
    });

    it('should warn when using HTTP in production', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'http://production.example.com',
        providers: ['google'],
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTPS')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should not warn when using HTTPS', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.rauth.dev',
        providers: ['google'],
      });

      // Should only warn about multiple init calls, not HTTPS
      const httpsWarnings = consoleWarnSpy.mock.calls.filter(call =>
        call[0].includes('HTTPS')
      );
      expect(httpsWarnings.length).toBe(0);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('URL construction with backend', () => {
    beforeEach(() => {
      initRauth({
        apiKey: 'test-api-key',
        baseUrl: BACKEND_URL,
        providers: ['google'],
      });
    });

    it('should build OAuth authorize URL', () => {
      const url = buildUrl('/api/v1/oauth/authorize');
      expect(url).toBe(`${BACKEND_URL}/api/v1/oauth/authorize`);
    });

    it('should build OAuth callback URL', () => {
      const url = buildUrl('/api/v1/oauth/callback');
      expect(url).toBe(`${BACKEND_URL}/api/v1/oauth/callback`);
    });

    it('should build session refresh URL', () => {
      const url = buildUrl('/api/v1/sessions/refresh');
      expect(url).toBe(`${BACKEND_URL}/api/v1/sessions/refresh`);
    });

    it('should build users/me URL', () => {
      const url = buildUrl('/api/v1/users/me');
      expect(url).toBe(`${BACKEND_URL}/api/v1/users/me`);
    });

    it('should build session delete URL with ID', () => {
      const sessionId = 'test-session-123';
      const url = buildUrl(`/api/v1/sessions/${sessionId}`);
      expect(url).toBe(`${BACKEND_URL}/api/v1/sessions/${sessionId}`);
    });
  });

  describe('Redirect URL configuration', () => {
    it('should accept custom redirect URL', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: BACKEND_URL,
        providers: ['google'],
        redirectUrl: 'http://localhost:5173/auth/callback',
      });

      expect(config.redirectUrl).toBe('http://localhost:5173/auth/callback');
    });

    it('should accept production redirect URL', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: 'https://api.rauth.dev',
        providers: ['google'],
        redirectUrl: 'https://myapp.com/auth/callback',
      });

      expect(config.redirectUrl).toBe('https://myapp.com/auth/callback');
    });
  });

  describe('Provider configuration', () => {
    it('should configure Google provider', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: BACKEND_URL,
        providers: ['google'],
      });

      expect(config.providers).toEqual(['google']);
    });

    it('should configure multiple providers', () => {
      const config = initRauth({
        apiKey: 'test-api-key',
        baseUrl: BACKEND_URL,
        providers: ['google', 'github', 'facebook'],
      });

      expect(config.providers).toEqual(['google', 'github', 'facebook']);
    });

    it('should validate supported providers', () => {
      expect(() => {
        initRauth({
          apiKey: 'test-api-key',
          baseUrl: BACKEND_URL,
          providers: ['invalid-provider' as any],
        });
      }).toThrow('Invalid provider');
    });
  });
});

/**
 * Environment-based Configuration Tests
 * 
 * Tests configuration from environment variables.
 */
describe('Environment-based Configuration', () => {
  afterEach(() => {
    resetConfig();
  });

  it('should use VITE_RAUTH_BASE_URL from env', () => {
    const config = initRauth({
      apiKey: 'test-api-key',
      baseUrl: process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080',
      providers: ['google'],
    });

    // Should use env var or fallback
    expect(config.baseUrl).toBeTruthy();
    expect(config.baseUrl).toMatch(/^https?:\/\//);
  });

  it('should prioritize explicit baseUrl over default', () => {
    const explicitUrl = 'http://custom-backend:9000';

    const config = initRauth({
      apiKey: 'test-api-key',
      baseUrl: explicitUrl,
      providers: ['google'],
    });

    expect(config.baseUrl).toBe(explicitUrl);
  });
});

/**
 * Backend Compatibility Tests
 * 
 * Ensures SDK configuration is compatible with backend expectations.
 */
describe('Backend Compatibility', () => {
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

  it('should construct URLs compatible with backend API versioning', () => {
    // Backend uses /api/v1/ prefix
    const url = buildUrl('/api/v1/oauth/authorize');

    expect(url).toContain('/api/v1/');
    expect(url).toBe(`${BACKEND_URL}/api/v1/oauth/authorize`);
  });

  it('should handle URL encoding for query parameters', () => {
    const callbackUrl = 'http://localhost:5173/auth/callback';
    const encoded = encodeURIComponent(callbackUrl);

    expect(encoded).toBe('http%3A%2F%2Flocalhost%3A5173%2Fauth%2Fcallback');
  });

  it('should construct proper OAuth authorization request', () => {
    const params = new URLSearchParams({
      provider: 'google',
      redirect_uri: 'http://localhost:5173/auth/callback',
      state: 'random-state-123',
    });

    const url = buildUrl(`/api/v1/oauth/authorize?${params.toString()}`);

    expect(url).toContain('provider=google');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('state=');
  });
});

/**
 * Debug Mode Configuration
 */
describe('Debug Mode with Backend', () => {
  afterEach(() => {
    resetConfig();
  });

  it('should enable debug logging when debug: true', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const config = initRauth({
      apiKey: 'test-api-key',
      baseUrl: BACKEND_URL,
      providers: ['google'],
      debug: true,
    });

    expect(config.debug).toBe(true);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Configuration initialized'),
      expect.any(Object)
    );

    consoleLogSpy.mockRestore();
  });

  it('should mask API key in debug output', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    initRauth({
      apiKey: 'pk_test_1234567890abcdef',
      baseUrl: BACKEND_URL,
      providers: ['google'],
      debug: true,
    });

    // Check that full API key is not logged
    const logCalls = consoleLogSpy.mock.calls;
    const hasFullKey = logCalls.some(call =>
      JSON.stringify(call).includes('pk_test_1234567890abcdef')
    );

    expect(hasFullKey).toBe(false);

    consoleLogSpy.mockRestore();
  });
});
