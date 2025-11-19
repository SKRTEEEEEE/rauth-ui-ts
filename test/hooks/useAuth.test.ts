/**
 * Tests for useAuth hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/providers/AuthProvider';
import React from 'react';
import type { User, Session } from '../../src/utils/types';

// Mock storage utilities
vi.mock('../../src/utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'rauth_access_token',
    REFRESH_TOKEN: 'rauth_refresh_token',
  },
}));

// Mock API utilities
vi.mock('../../src/utils/api', () => ({
  initApi: vi.fn(),
  getCurrentUser: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });
  });

  describe('Basic functionality', () => {
    it('should return auth state when used within AuthProvider', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('session');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toBeDefined();
    });

    it('should return auth functions', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refreshSession');
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.refreshSession).toBe('function');
    });

    it('should include config in return value', async () => {
      const config = { apiKey: 'test-key', baseUrl: 'https://test.api' };
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('config');
      expect(result.current.config).toEqual(config);
    });
  });

  describe('isAuthenticated computation', () => {
    it('should return false when user is null', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should return false when session is null', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('TypeScript type inference', () => {
    it('should have correct return type structure', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verify all expected properties exist
      const expectedProperties = [
        'isAuthenticated',
        'user',
        'session',
        'loading',
        'login',
        'logout',
        'refreshSession',
        'config'
      ];

      expectedProperties.forEach(prop => {
        expect(result.current).toHaveProperty(prop);
      });
    });
  });

  describe('Error state', () => {
    it('should handle error property when present', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Error property may or may not be present
      if ('error' in result.current) {
        expect(typeof result.current.error === 'string' || result.current.error === undefined).toBe(true);
      }
    });
  });

  describe('Function calls', () => {
    it('should allow calling login function without throwing', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw when calling login
      expect(() => result.current.login('google')).not.toThrow();
    });

    it('should allow calling logout function without throwing', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw when calling logout
      await expect(result.current.logout()).resolves.not.toThrow();
    });

    it('should allow calling refreshSession function without throwing', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(AuthProvider, { config: { apiKey: 'test-key' } }, children)
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw when calling refreshSession
      expect(() => result.current.refreshSession()).not.toThrow();
    });
  });
});
