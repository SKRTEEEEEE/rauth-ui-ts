/**
 * Integration tests for AuthProvider
 * Tests the full flow of authentication with real-like scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../src/providers/AuthProvider';
import { storage } from '../../src/utils/storage';
import type { RAuthConfig, User } from '../../src/utils/types';
import * as api from '../../src/utils/api';
import * as jwt from '../../src/utils/jwt';

// Mock dependencies
vi.mock('../../src/utils/storage');
vi.mock('../../src/utils/api');
vi.mock('../../src/utils/jwt');

describe('AuthProvider Integration Tests', () => {
  const mockConfig: RAuthConfig = {
    apiKey: 'integration-test-key',
    baseUrl: 'https://api.rauth.dev',
    providers: ['google', 'github'],
  };

  const mockUser: User = {
    id: 'user-456',
    email: 'integration@example.com',
    name: 'Integration Test User',
    avatar: 'https://example.com/avatar2.jpg',
    emailVerified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Full authentication flow', () => {
    it('should handle complete login to logout flow', async () => {
      // Setup: User starts authenticated with a token
      vi.mocked(storage.getAccessToken).mockReturnValue('valid-token');
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

      const clearSpy = vi.spyOn(storage, 'clear');

      const TestComponent = () => {
        const { isAuthenticated, user, loading, logout } = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <div data-testid="user">{user?.email || 'null'}</div>
            <button onClick={logout}>Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for authentication to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(mockUser.email);

      // User logs out
      const logoutButton = screen.getByText('Logout');
      logoutButton.click();

      await waitFor(() => {
        expect(clearSpy).toHaveBeenCalled();
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should handle session restoration on page reload', async () => {
      // Setup: Existing valid token in storage
      const existingToken = 'existing-valid-token';
      vi.mocked(storage.getAccessToken).mockReturnValue(existingToken);
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { isAuthenticated, user, loading } = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <div data-testid="user">{user?.email || 'null'}</div>
          </div>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      // Should start loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      // Should restore session
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(mockUser.email);
      expect(api.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should handle token expiration gracefully', async () => {
      // Setup: Expired token in storage
      const expiredToken = 'expired-token';
      vi.mocked(storage.getAccessToken).mockReturnValue(expiredToken);
      vi.mocked(jwt.isTokenExpired).mockReturnValue(true);

      const TestComponent = () => {
        const { isAuthenticated, loading } = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('false');
      expect(api.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('Multiple consumers', () => {
    it('should provide same context to multiple components', async () => {
      vi.mocked(storage.getAccessToken).mockReturnValue('valid-token');
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

      const Consumer1 = () => {
        const { user } = useAuthContext();
        return <div data-testid="consumer1">{user?.email || 'null'}</div>;
      };

      const Consumer2 = () => {
        const { isAuthenticated } = useAuthContext();
        return <div data-testid="consumer2">{isAuthenticated.toString()}</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <Consumer1 />
          <Consumer2 />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('consumer1').textContent).toBe(mockUser.email);
      });

      expect(screen.getByTestId('consumer2').textContent).toBe('true');
    });
  });

  describe('Error recovery', () => {
    it('should handle API error gracefully', async () => {
      // API fails
      vi.mocked(storage.getAccessToken).mockReturnValue('valid-token');
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockRejectedValue(new Error('API Error'));

      const TestComponent = () => {
        const { error, loading, isAuthenticated } = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="error">{error || 'null'}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
          </div>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('error').textContent).toBe('API Error');
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });
  });

  describe('Config changes', () => {
    it('should reinitialize API when config changes', async () => {
      const initApiSpy = vi.spyOn(api, 'initApi');
      vi.mocked(storage.getAccessToken).mockReturnValue(null);

      const TestComponent = () => <div>Test</div>;

      const { rerender } = render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      expect(initApiSpy).toHaveBeenCalledWith(
        mockConfig.apiKey,
        mockConfig.baseUrl
      );

      const newConfig = {
        ...mockConfig,
        apiKey: 'new-api-key',
      };

      rerender(
        <AuthProvider config={newConfig}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(initApiSpy).toHaveBeenCalledWith(
          newConfig.apiKey,
          newConfig.baseUrl
        );
      });
    });
  });
});
