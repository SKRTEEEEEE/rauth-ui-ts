/**
 * Tests for storage utilities
 * 
 * These tests verify SSR-safe storage functionality including
 * localStorage, sessionStorage, and cookies support with proper
 * serialization, prefix handling, and client-side detection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import type { User, Session } from '../../src/utils/types';

// Import storage utilities (will be implemented)
import {
  isClient,
  setItem,
  getItem,
  removeItem,
  clear,
  setCookie,
  getCookie,
  removeCookie,
  saveSession,
  getSession,
  clearSession,
  createStorageAdapter,
} from '../../src/utils/storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Initialize SDK with default config
    initRauth({
      apiKey: 'pk_test_123456',
      providers: ['google'],
      storage: {
        type: 'localStorage',
        prefix: 'test_rauth_',
      },
    });

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  afterEach(() => {
    resetConfig();
    vi.restoreAllMocks();
  });

  describe('isClient helper', () => {
    it('should return true in browser environment', () => {
      expect(isClient()).toBe(true);
    });

    it('should return false when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore - Testing SSR scenario
      delete global.window;

      expect(isClient()).toBe(false);

      // Restore
      global.window = originalWindow;
    });
  });

  describe('localStorage operations', () => {
    it('should store and retrieve string values', () => {
      setItem('test_key', 'test_value');
      const value = getItem('test_key');

      expect(value).toBe('test_value');
    });

    it('should store and retrieve object values with JSON serialization', () => {
      const obj = { id: '123', name: 'Test User' };
      setItem('test_obj', obj);
      const retrieved = getItem('test_obj');

      expect(retrieved).toEqual(obj);
    });

    it('should apply storage prefix from config', () => {
      setItem('my_key', 'my_value');
      
      // Check that the actual localStorage has the prefixed key
      const rawValue = localStorage.getItem('test_rauth_my_key');
      expect(rawValue).toBe(JSON.stringify('my_value'));
    });

    it('should return null for non-existent keys', () => {
      const value = getItem('non_existent_key');
      expect(value).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('test_rauth_invalid', 'not valid json {');
      
      const value = getItem('invalid');
      expect(value).toBeNull();
    });

    it('should remove items', () => {
      setItem('to_remove', 'value');
      expect(getItem('to_remove')).toBe('value');

      removeItem('to_remove');
      expect(getItem('to_remove')).toBeNull();
    });

    it('should clear only prefixed items', () => {
      // Set RAuth items
      setItem('rauth_item1', 'value1');
      setItem('rauth_item2', 'value2');
      
      // Set non-RAuth item
      localStorage.setItem('other_app_item', 'other_value');

      clear();

      // RAuth items should be cleared
      expect(getItem('rauth_item1')).toBeNull();
      expect(getItem('rauth_item2')).toBeNull();
      
      // Other app item should remain
      expect(localStorage.getItem('other_app_item')).toBe('other_value');
    });

    it('should handle QuotaExceededError gracefully', () => {
      // Mock localStorage.setItem to throw QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      setItemSpy.mockImplementation(() => {
        throw quotaError;
      });

      // Should not throw
      expect(() => setItem('key', 'value')).not.toThrow();

      setItemSpy.mockRestore();
    });

    it('should be no-op in SSR environment (no window)', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // Should not throw
      expect(() => setItem('key', 'value')).not.toThrow();
      expect(() => getItem('key')).not.toThrow();
      expect(() => removeItem('key')).not.toThrow();
      expect(() => clear()).not.toThrow();

      // Should return null
      expect(getItem('key')).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });

  describe('sessionStorage operations', () => {
    beforeEach(() => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'sessionStorage',
          prefix: 'test_rauth_',
        },
      });
    });

    it('should use sessionStorage when configured', () => {
      const adapter = createStorageAdapter();
      
      adapter.set('session_key', 'session_value');
      
      // Should be in sessionStorage, not localStorage
      expect(sessionStorage.getItem('test_rauth_session_key')).toBeTruthy();
      expect(localStorage.getItem('test_rauth_session_key')).toBeNull();
    });

    it('should retrieve from sessionStorage', () => {
      const adapter = createStorageAdapter();
      
      adapter.set('session_key', 'session_value');
      const value = adapter.get('session_key');
      
      expect(value).toBe('session_value');
    });

    it('should clear sessionStorage items with prefix', () => {
      const adapter = createStorageAdapter();
      
      adapter.set('item1', 'value1');
      adapter.set('item2', 'value2');
      sessionStorage.setItem('other_item', 'other_value');

      adapter.clear();

      expect(adapter.get('item1')).toBeNull();
      expect(adapter.get('item2')).toBeNull();
      expect(sessionStorage.getItem('other_item')).toBe('other_value');
    });
  });

  describe('Cookie operations', () => {
    it('should set and get cookies', () => {
      setCookie('test_cookie', 'cookie_value', {
        path: '/',
        maxAge: 3600,
      });

      const value = getCookie('test_cookie');
      expect(value).toBe('cookie_value');
    });

    it('should set cookie with secure and sameSite options', () => {
      setCookie('secure_cookie', 'secure_value', {
        secure: true,
        sameSite: 'strict',
        path: '/',
      });

      // Check that cookie is set
      expect(document.cookie).toContain('secure_cookie');
    });

    it('should handle object values in cookies with JSON serialization', () => {
      const obj = { id: '123', email: 'test@example.com' };
      setCookie('obj_cookie', obj, { path: '/' });

      const retrieved = getCookie('obj_cookie');
      expect(retrieved).toEqual(obj);
    });

    it('should remove cookies', () => {
      setCookie('to_remove', 'value', { path: '/' });
      expect(getCookie('to_remove')).toBe('value');

      removeCookie('to_remove', { path: '/' });
      expect(getCookie('to_remove')).toBeNull();
    });

    it('should return null for non-existent cookies', () => {
      const value = getCookie('non_existent_cookie');
      expect(value).toBeNull();
    });

    it('should handle invalid JSON in cookies gracefully', () => {
      // Set cookie with invalid JSON
      document.cookie = 'test_rauth_invalid_cookie=not-valid-json{; path=/';
      
      const value = getCookie('invalid_cookie');
      // Should either return null or the raw string (implementation dependent)
      expect(value === null || typeof value === 'string').toBe(true);
    });

    it('should be no-op in SSR environment', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      expect(() => setCookie('key', 'value')).not.toThrow();
      expect(() => getCookie('key')).not.toThrow();
      expect(() => removeCookie('key')).not.toThrow();

      expect(getCookie('key')).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('Storage adapter', () => {
    it('should create adapter with localStorage by default', () => {
      const adapter = createStorageAdapter();
      
      adapter.set('test', 'value');
      expect(localStorage.getItem('test_rauth_test')).toBeTruthy();
    });

    it('should create adapter with sessionStorage when configured', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: { type: 'sessionStorage' },
      });

      const adapter = createStorageAdapter();
      
      adapter.set('test', 'value');
      expect(sessionStorage.getItem('rauth_test')).toBeTruthy();
    });

    it('should create adapter with cookies when configured', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'cookies',
          cookieOptions: {
            path: '/',
            secure: true,
            sameSite: 'lax',
          },
        },
      });

      const adapter = createStorageAdapter();
      
      adapter.set('test', 'value');
      expect(document.cookie).toContain('test');
    });

    it('should provide unified API (get, set, remove, clear)', () => {
      const adapter = createStorageAdapter();

      // Set
      adapter.set('key1', 'value1');
      adapter.set('key2', { nested: 'object' });

      // Get
      expect(adapter.get('key1')).toBe('value1');
      expect(adapter.get('key2')).toEqual({ nested: 'object' });

      // Remove
      adapter.remove('key1');
      expect(adapter.get('key1')).toBeNull();

      // Clear
      adapter.clear();
      expect(adapter.get('key2')).toBeNull();
    });
  });

  describe('Auth-specific functions', () => {
    const mockUser: User = {
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockSession: Session = {
      id: 'session_123',
      userId: 'user_123',
      accessToken: 'access_token_123',
      refreshToken: 'refresh_token_123',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      createdAt: '2024-01-01T00:00:00Z',
      provider: 'google',
    };

    describe('saveSession', () => {
      it('should save complete session data', () => {
        saveSession(mockSession, mockUser);

        // Verify session is saved
        const savedSession = getItem('session');
        expect(savedSession).toEqual(mockSession);

        // Verify user is saved
        const savedUser = getItem('user');
        expect(savedUser).toEqual(mockUser);

        // Verify tokens are saved separately
        const accessToken = getItem('access_token');
        expect(accessToken).toBe('access_token_123');

        const refreshToken = getItem('refresh_token');
        expect(refreshToken).toBe('refresh_token_123');

        // Verify expiresAt is saved
        const expiresAt = getItem('expires_at');
        expect(expiresAt).toBe(mockSession.expiresAt);
      });

      it('should update existing session', () => {
        saveSession(mockSession, mockUser);

        const updatedSession = {
          ...mockSession,
          accessToken: 'new_access_token',
        };

        saveSession(updatedSession, mockUser);

        const accessToken = getItem('access_token');
        expect(accessToken).toBe('new_access_token');
      });
    });

    describe('getSession', () => {
      it('should retrieve valid session', () => {
        saveSession(mockSession, mockUser);

        const result = getSession();

        expect(result).toBeTruthy();
        expect(result?.session).toEqual(mockSession);
        expect(result?.user).toEqual(mockUser);
      });

      it('should return null if session does not exist', () => {
        const result = getSession();
        expect(result).toBeNull();
      });

      it('should return null if session is expired', () => {
        const expiredSession = {
          ...mockSession,
          expiresAt: Date.now() - 10000, // Expired 10 seconds ago
        };

        saveSession(expiredSession, mockUser);

        const result = getSession();
        expect(result).toBeNull();
      });

      it('should return session if not expired', () => {
        const validSession = {
          ...mockSession,
          expiresAt: Date.now() + 10000, // Expires in 10 seconds
        };

        saveSession(validSession, mockUser);

        const result = getSession();
        expect(result).toBeTruthy();
        expect(result?.session.expiresAt).toBe(validSession.expiresAt);
      });

      it('should handle corrupted session data gracefully', () => {
        // Set invalid session data
        localStorage.setItem('test_rauth_session', 'invalid json');

        const result = getSession();
        expect(result).toBeNull();
      });
    });

    describe('clearSession', () => {
      it('should clear all session data', () => {
        saveSession(mockSession, mockUser);

        // Verify data is saved
        expect(getItem('session')).toBeTruthy();
        expect(getItem('user')).toBeTruthy();
        expect(getItem('access_token')).toBeTruthy();

        clearSession();

        // Verify all data is cleared
        expect(getItem('session')).toBeNull();
        expect(getItem('user')).toBeNull();
        expect(getItem('access_token')).toBeNull();
        expect(getItem('refresh_token')).toBeNull();
        expect(getItem('expires_at')).toBeNull();
      });

      it('should not affect other storage items', () => {
        saveSession(mockSession, mockUser);
        localStorage.setItem('other_app_data', 'should_remain');

        clearSession();

        expect(localStorage.getItem('other_app_data')).toBe('should_remain');
      });
    });
  });

  describe('Prefix configuration', () => {
    it('should use custom prefix from config', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'localStorage',
          prefix: 'myapp_auth_',
        },
      });

      setItem('test', 'value');

      expect(localStorage.getItem('myapp_auth_test')).toBeTruthy();
    });

    it('should use default prefix if not specified', () => {
      resetConfig();
      initRauth({
        apiKey: 'pk_test_123456',
        providers: ['google'],
      });

      setItem('test', 'value');

      // Default prefix is 'rauth_'
      expect(localStorage.getItem('rauth_test')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string values', () => {
      setItem('empty', '');
      expect(getItem('empty')).toBe('');
    });

    it('should handle null values', () => {
      setItem('null', null);
      const value = getItem('null');
      expect(value).toBeNull();
    });

    it('should handle undefined values', () => {
      setItem('undefined', undefined);
      const value = getItem('undefined');
      // Undefined becomes null in JSON
      expect(value === null || value === undefined).toBe(true);
    });

    it('should handle boolean values', () => {
      setItem('bool_true', true);
      setItem('bool_false', false);

      expect(getItem('bool_true')).toBe(true);
      expect(getItem('bool_false')).toBe(false);
    });

    it('should handle number values', () => {
      setItem('number', 42);
      setItem('float', 3.14);

      expect(getItem('number')).toBe(42);
      expect(getItem('float')).toBe(3.14);
    });

    it('should handle array values', () => {
      const arr = [1, 2, 3, { nested: 'value' }];
      setItem('array', arr);

      expect(getItem('array')).toEqual(arr);
    });

    it('should handle nested objects', () => {
      const nested = {
        level1: {
          level2: {
            level3: 'deep value',
          },
        },
      };
      setItem('nested', nested);

      expect(getItem('nested')).toEqual(nested);
    });
  });
});
