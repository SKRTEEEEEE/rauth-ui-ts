/**
 * Integration tests for AuthProvider OAuth functionality
 * 
 * Tests the integration between AuthProvider and OAuth flow,
 * including automatic callback handling, state management,
 * and callback execution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../src/providers/AuthProvider';
import { initRauth } from '../../src/utils/config';
import type { LoginResponse } from '../../src/utils/types';

// Test component to access auth context
function TestComponent() {
  const { isAuthenticated, user, loading, login } = useAuthContext();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => login('google')}>Login</button>
    </div>
  );
}

describe('AuthProvider OAuth Integration', () => {
  const mockLoginResponse: LoginResponse = {
    user: {
      id: 'user-123',
      email: 'oauth@example.com',
      name: 'OAuth User',
      emailVerified: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    session: {
      id: 'session-123',
      userId: 'user-123',
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjQwMDAwMDAwfQ.test',
      refreshToken: 'refresh-token-123',
      expiresAt: 9999999999000,
      createdAt: '2025-01-01T00:00:00Z',
      provider: 'google',
    },
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNjQwMDAwMDAwfQ.test',
    refreshToken: 'refresh-token-123',
    expiresAt: 9999999999000,
  };

  beforeEach(() => {
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Initialize SDK
    initRauth({
      apiKey: 'test-api-key',
      baseUrl: 'https://test.api.rauth.dev',
      redirectUrl: 'https://test.app.com/auth/callback',
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { 
      href: 'https://test.app.com/',
      origin: 'https://test.app.com',
      search: '',
      pathname: '/',
    };

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login function', () => {
    it('should call initiateOAuth when login is invoked', async () => {
      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      const { getByText } = render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = getByText('Login');
      loginButton.click();

      // Should redirect (window.location.href will be set)
      await waitFor(() => {
        expect(window.location.href).toContain('/api/v1/oauth/authorize');
      });
    });

    it('should generate state parameter on login', async () => {
      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      const { getByText } = render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        const savedState = sessionStorage.getItem('oauth_state');
        expect(savedState).toBeDefined();
        expect(savedState).not.toBe('');
      });
    });
  });

  describe('automatic callback handling', () => {
    it('should detect code in URL on mount', async () => {
      // Set up URL with OAuth callback params
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });
    });

    it('should process callback and set user state', async () => {
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('oauth@example.com');
      });
    });

    it('should save tokens to storage after callback', async () => {
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        // Storage serializes values to JSON, so we need to parse
        const accessToken = localStorage.getItem('rauth_access_token');
        const parsedToken = accessToken ? JSON.parse(accessToken) : null;
        expect(parsedToken).toBe(mockLoginResponse.accessToken);
      });
    });

    it('should handle callback errors gracefully', async () => {
      (window as any).location.search = '?error=access_denied&error_description=User+denied';

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
      });
    });

    it('should not process callback if no code param', async () => {
      (window as any).location.search = '';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Fetch should not be called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('callbacks execution', () => {
    it('should call onLoginSuccess callback after successful OAuth', async () => {
      const onLoginSuccess = vi.fn();
      
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
        onLoginSuccess,
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalledWith(mockLoginResponse.user);
      });
    });

    it('should call onError callback on OAuth failure', async () => {
      const onError = vi.fn();
      
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: 'Invalid authorization code',
          code: 'ERR_INVALID_CODE',
        }),
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
        onError,
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('URL cleanup', () => {
    it('should clean URL params after processing callback', async () => {
      const mockReplaceState = vi.fn();
      window.history.replaceState = mockReplaceState;
      
      (window as any).location.search = '?code=auth-code-123&state=valid-state';
      (window as any).location.pathname = '/auth/callback';
      sessionStorage.setItem('oauth_state', 'valid-state');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      });

      const config = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.api.rauth.dev',
      };

      render(
        <AuthProvider config={config}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalledWith(
          {},
          '',
          '/auth/callback'
        );
      });
    });
  });
});
