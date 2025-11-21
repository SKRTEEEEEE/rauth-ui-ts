/**
 * Tests for SSR cookie utilities
 * 
 * These tests verify server-side rendering (SSR) support for cookies,
 * including context detection, cookie parsing, server-side cookie
 * operations, and Next.js integration patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import type { Session, User } from '../../src/utils/types';

// Import SSR utilities (to be implemented)
import {
  isServer,
  parseCookies,
  getCookieServer,
  setCookieServer,
  getCookie,
  setCookie,
  getSessionFromCookies,
} from '../../src/utils/storage';

describe('SSR Cookie Utilities', () => {
  beforeEach(() => {
    // Initialize SDK with cookie storage
    initRauth({
      apiKey: 'test_api_key_123456',
      providers: ['google'],
      storage: {
        type: 'cookies',
        prefix: 'test_rauth_',
        cookieOptions: {
          path: '/',
          secure: true,
          sameSite: 'lax',
        },
      },
    });
  });

  afterEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  describe('isServer helper', () => {
    it('should return false in browser environment', () => {
      expect(isServer()).toBe(false);
    });

    it('should return true when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      expect(isServer()).toBe(true);

      // Restore
      global.window = originalWindow;
    });

    it('should be opposite of isClient', async () => {
      const { isClient } = await import('../../src/utils/storage');
      expect(isServer()).toBe(!isClient());
    });
  });

  describe('parseCookies', () => {
    it('should parse simple cookie header', () => {
      const cookieHeader = 'session=abc123; user=xyz789';
      const parsed = parseCookies(cookieHeader);

      expect(parsed).toEqual({
        session: 'abc123',
        user: 'xyz789',
      });
    });

    it('should parse cookie header with spaces', () => {
      const cookieHeader = 'session=abc123;  user=xyz789;  token=def456';
      const parsed = parseCookies(cookieHeader);

      expect(parsed).toEqual({
        session: 'abc123',
        user: 'xyz789',
        token: 'def456',
      });
    });

    it('should handle cookies with equals signs in values', () => {
      const cookieHeader = 'data=key=value; token=abc=123=xyz';
      const parsed = parseCookies(cookieHeader);

      expect(parsed).toEqual({
        data: 'key=value',
        token: 'abc=123=xyz',
      });
    });

    it('should handle empty cookie header', () => {
      const parsed = parseCookies('');
      expect(parsed).toEqual({});
    });

    it('should handle malformed cookies gracefully', () => {
      const cookieHeader = 'valid=abc; ; invalid; another=xyz';
      const parsed = parseCookies(cookieHeader);

      // Should skip malformed entries
      expect(parsed).toEqual({
        valid: 'abc',
        another: 'xyz',
      });
    });

    it('should decode URI-encoded cookie names and values', () => {
      const cookieHeader = 'test_rauth_user=%7B%22id%22%3A%22123%22%7D';
      const parsed = parseCookies(cookieHeader);

      expect(parsed['test_rauth_user']).toBe('{"id":"123"}');
    });

    it('should handle cookies with no value', () => {
      const cookieHeader = 'empty=; valid=test';
      const parsed = parseCookies(cookieHeader);

      expect(parsed).toEqual({
        empty: '',
        valid: 'test',
      });
    });
  });

  describe('getCookieServer', () => {
    it('should retrieve cookie value from cookie header', () => {
      const sessionValue = encodeURIComponent(JSON.stringify('abc123'));
      const cookieHeader = `test_rauth_session=${sessionValue}; test_rauth_user=xyz789`;
      const value = getCookieServer('session', cookieHeader);

      expect(value).toBe('abc123');
    });

    it('should return null for non-existent cookie', () => {
      const cookieHeader = 'test_rauth_session=abc123';
      const value = getCookieServer('user', cookieHeader);

      expect(value).toBeNull();
    });

    it('should deserialize JSON values', () => {
      const obj = { id: '123', email: 'test@example.com' };
      const serialized = JSON.stringify(obj);
      const encoded = encodeURIComponent(serialized);
      const cookieHeader = `test_rauth_user=${encoded}`;

      const value = getCookieServer<typeof obj>('user', cookieHeader);

      expect(value).toEqual(obj);
    });

    it('should apply storage prefix from config', () => {
      const myValue = encodeURIComponent(JSON.stringify('my_value'));
      const cookieHeader = `test_rauth_my_key=${myValue}`;
      const value = getCookieServer('my_key', cookieHeader);

      expect(value).toBe('my_value');
    });

    it('should return null for empty cookie header', () => {
      const value = getCookieServer('session', '');
      expect(value).toBeNull();
    });

    it('should handle undefined cookie header', () => {
      const value = getCookieServer('session', undefined);
      expect(value).toBeNull();
    });

    it('should handle cookies with empty values', () => {
      const cookieHeader = 'test_rauth_empty=';
      const value = getCookieServer('empty', cookieHeader);

      // Empty string should be treated as null
      expect(value).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const complexObj = {
        user: { id: '123', name: 'Test' },
        session: { token: 'abc', expiresAt: 1234567890 },
      };
      const serialized = JSON.stringify(complexObj);
      const encoded = encodeURIComponent(serialized);
      const cookieHeader = `test_rauth_data=${encoded}`;

      const value = getCookieServer<typeof complexObj>('data', cookieHeader);

      expect(value).toEqual(complexObj);
    });
  });

  describe('setCookieServer', () => {
    it('should generate Set-Cookie header string', () => {
      const cookieString = setCookieServer('session', 'abc123');

      expect(cookieString).toContain('test_rauth_session=');
      expect(cookieString).toContain('abc123');
    });

    it('should serialize JSON values', () => {
      const obj = { id: '123', email: 'test@example.com' };
      const cookieString = setCookieServer('user', obj);

      // Should contain URL-encoded JSON
      expect(cookieString).toContain('test_rauth_user=');
      expect(cookieString).toContain(encodeURIComponent(JSON.stringify(obj)));
    });

    it('should apply default cookie options from config', () => {
      const cookieString = setCookieServer('test', 'value');

      // Should include default options from config
      expect(cookieString).toContain('Path=/');
      expect(cookieString).toContain('Secure');
      expect(cookieString).toContain('SameSite=Lax');
    });

    it('should apply custom cookie options', () => {
      const cookieString = setCookieServer('test', 'value', {
        maxAge: 3600,
        domain: '.example.com',
        secure: true,
        sameSite: 'strict',
        path: '/api',
      });

      expect(cookieString).toContain('Max-Age=3600');
      expect(cookieString).toContain('Domain=.example.com');
      expect(cookieString).toContain('Secure');
      expect(cookieString).toContain('SameSite=Strict');
      expect(cookieString).toContain('Path=/api');
    });

    it('should handle httpOnly flag', () => {
      const cookieString = setCookieServer('test', 'value', {
        httpOnly: true,
      });

      expect(cookieString).toContain('HttpOnly');
    });

    it('should not include httpOnly flag when false', () => {
      const cookieString = setCookieServer('test', 'value', {
        httpOnly: false,
      });

      expect(cookieString).not.toContain('HttpOnly');
    });

    it('should handle cookie deletion (maxAge=0)', () => {
      const cookieString = setCookieServer('test', '', {
        maxAge: 0,
      });

      expect(cookieString).toContain('Max-Age=0');
    });

    it('should apply storage prefix from config', () => {
      const cookieString = setCookieServer('my_key', 'my_value');

      expect(cookieString).toContain('test_rauth_my_key=');
    });

    it('should handle special characters in values', () => {
      const value = 'test@value#with$special%chars';
      const cookieString = setCookieServer('test', value);

      // Should be URL-encoded
      expect(cookieString).toContain(encodeURIComponent(JSON.stringify(value)));
    });
  });

  describe('getCookie unified wrapper', () => {
    it('should use client-side implementation in browser', () => {
      // In browser environment (vitest runs in browser-like environment)
      document.cookie = 'test_rauth_session=' + encodeURIComponent(JSON.stringify('abc123'));
      
      const value = getCookie('session');
      expect(value).toBe('abc123');
    });

    it('should use server-side implementation when cookieHeader provided', () => {
      const cookieHeader = 'test_rauth_session=' + encodeURIComponent(JSON.stringify('abc123'));
      
      const value = getCookie('session', cookieHeader);
      expect(value).toBe('abc123');
    });

    it('should return null in SSR without cookieHeader', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const value = getCookie('session');
      expect(value).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('setCookie unified wrapper', () => {
    it('should use client-side implementation in browser', () => {
      setCookie('test_key', 'test_value', { path: '/' });

      // Verify cookie was set
      const value = getCookie('test_key');
      expect(value).toBe('test_value');
    });

    it('should return Set-Cookie header string in SSR', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      const result = setCookie('test_key', 'test_value', { path: '/' });

      // In SSR, should return string
      expect(typeof result).toBe('string');
      expect(result).toContain('test_rauth_test_key=');

      // Restore
      global.window = originalWindow;
    });
  });

  describe('getSessionFromCookies', () => {
    it('should extract and parse session from cookies', () => {
      const session: Session = {
        id: 'session123',
        userId: 'user123',
        accessToken: 'token123',
        refreshToken: 'refresh123',
        expiresAt: Date.now() + 3600000,
        createdAt: new Date().toISOString(),
        provider: 'google',
      };

      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(session));
      const userCookie = encodeURIComponent(JSON.stringify(user));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const result = getSessionFromCookies(cookieHeader);

      expect(result).not.toBeNull();
      expect(result?.session).toEqual(session);
      expect(result?.user).toEqual(user);
    });

    it('should return null when session cookie missing', () => {
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userCookie = encodeURIComponent(JSON.stringify(user));
      const cookieHeader = `test_rauth_user=${userCookie}`;

      const result = getSessionFromCookies(cookieHeader);
      expect(result).toBeNull();
    });

    it('should return null when user cookie missing', () => {
      const session: Session = {
        id: 'session123',
        userId: 'user123',
        accessToken: 'token123',
        refreshToken: 'refresh123',
        expiresAt: Date.now() + 3600000,
        createdAt: new Date().toISOString(),
        provider: 'google',
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(session));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const result = getSessionFromCookies(cookieHeader);
      expect(result).toBeNull();
    });

    it('should return null when session is expired', () => {
      const session: Session = {
        id: 'session123',
        userId: 'user123',
        accessToken: 'token123',
        refreshToken: 'refresh123',
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
        createdAt: new Date().toISOString(),
        provider: 'google',
      };

      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(session));
      const userCookie = encodeURIComponent(JSON.stringify(user));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const result = getSessionFromCookies(cookieHeader);
      expect(result).toBeNull();
    });

    it('should return null for malformed cookie data', () => {
      const cookieHeader = 'test_rauth_session=invalid_json; test_rauth_user=also_invalid';

      const result = getSessionFromCookies(cookieHeader);
      expect(result).toBeNull();
    });

    it('should handle empty cookie header', () => {
      const result = getSessionFromCookies('');
      expect(result).toBeNull();
    });

    it('should handle undefined cookie header', () => {
      const result = getSessionFromCookies(undefined);
      expect(result).toBeNull();
    });
  });

  describe('Security flags', () => {
    it('should apply secure flag in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const cookieString = setCookieServer('test', 'value');
      expect(cookieString).toContain('Secure');

      process.env.NODE_ENV = originalEnv;
    });

    it('should apply sameSite=lax by default for CSRF protection', () => {
      const cookieString = setCookieServer('test', 'value');
      expect(cookieString).toMatch(/SameSite=Lax/i);
    });

    it('should support sameSite=strict for enhanced security', () => {
      const cookieString = setCookieServer('test', 'value', {
        sameSite: 'strict',
      });
      expect(cookieString).toMatch(/SameSite=Strict/i);
    });

    it('should support sameSite=none with secure flag', () => {
      const cookieString = setCookieServer('test', 'value', {
        sameSite: 'none',
        secure: true,
      });
      expect(cookieString).toMatch(/SameSite=None/i);
      expect(cookieString).toContain('Secure');
    });
  });

  describe('Next.js integration patterns', () => {
    it('should work with getServerSideProps pattern', () => {
      // Simulate Next.js getServerSideProps
      const mockReq = {
        headers: {
          cookie: 'test_rauth_session=' + encodeURIComponent(JSON.stringify({
            id: 'session123',
            userId: 'user123',
            accessToken: 'token123',
            refreshToken: 'refresh123',
            expiresAt: Date.now() + 3600000,
            createdAt: new Date().toISOString(),
            provider: 'google' as const,
          })) + '; test_rauth_user=' + encodeURIComponent(JSON.stringify({
            id: 'user123',
            email: 'test@example.com',
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        },
      };

      const sessionData = getSessionFromCookies(mockReq.headers.cookie);

      expect(sessionData).not.toBeNull();
      expect(sessionData?.user.email).toBe('test@example.com');
    });

    it('should work with API route pattern', () => {
      // Simulate Next.js API route response
      const mockRes = {
        headers: new Map<string, string>(),
        setHeader(name: string, value: string) {
          this.headers.set(name, value);
        },
      };

      const cookieString = setCookieServer('session', 'abc123', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600,
      });

      mockRes.setHeader('Set-Cookie', cookieString);

      const setCookieHeader = mockRes.headers.get('Set-Cookie');
      expect(setCookieHeader).toContain('test_rauth_session=');
      expect(setCookieHeader).toContain('HttpOnly');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle null values gracefully', () => {
      const cookieString = setCookieServer('test', null);
      expect(cookieString).toContain('test_rauth_test=');
    });

    it('should handle undefined values gracefully', () => {
      const cookieString = setCookieServer('test', undefined);
      expect(cookieString).toContain('test_rauth_test=');
    });

    it('should handle very long cookie values', () => {
      const longValue = 'x'.repeat(4000); // Near cookie size limit
      const cookieString = setCookieServer('test', longValue);
      
      expect(cookieString).toContain('test_rauth_test=');
      // Note: Actual cookie size limits should be handled by browser/server
    });

    it('should handle concurrent cookie operations', () => {
      const sessionValue = encodeURIComponent(JSON.stringify('abc'));
      const userValue = encodeURIComponent(JSON.stringify('xyz'));
      const tokenValue = encodeURIComponent(JSON.stringify('123'));
      const cookieHeader = `test_rauth_session=${sessionValue}; test_rauth_user=${userValue}; test_rauth_token=${tokenValue}`;
      
      const session = getCookieServer('session', cookieHeader);
      const user = getCookieServer('user', cookieHeader);
      const token = getCookieServer('token', cookieHeader);

      expect(session).toBe('abc');
      expect(user).toBe('xyz');
      expect(token).toBe('123');
    });
  });
});
