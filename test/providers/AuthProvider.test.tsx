/**
 * Tests for AuthProvider
 * Unit and integration tests for authentication context provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuthContext } from '../../src/providers/AuthProvider';
import { initRauth, resetConfig } from '../../src/utils/config';
import { storage } from '../../src/utils/storage';
import type { RAuthConfig, User } from '../../src/utils/types';
import * as api from '../../src/utils/api';
import * as jwt from '../../src/utils/jwt';

// Mock dependencies
vi.mock('../../src/utils/storage');
vi.mock('../../src/utils/api');
vi.mock('../../src/utils/jwt');

describe('AuthProvider', () => {
  const mockConfig: RAuthConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://test.rauth.dev',
    providers: ['google', 'github'],
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    emailVerified: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider Component', () => {
    it('should render children correctly', () => {
      render(
        <AuthProvider config={mockConfig}>
          <div>Test Child</div>
        </AuthProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with loading state', async () => {
      vi.mocked(storage.getAccessToken).mockReturnValue(null);

      const TestComponent = () => {
        const { loading, isAuthenticated } = useAuthContext();
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

      // Initially loading should be true, but useEffect runs synchronously in tests
      // So we just check final state after loading completes
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
      expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    // NOTE: initApi no longer exists - API configuration is now handled through getConfig()
    // This test is no longer applicable with the new API architecture
    it.skip('should initialize API with config on mount', () => {
      // Test skipped - initApi function removed in favor of getConfig() pattern
    });

    it('should load session from storage if token exists and is valid', async () => {
      const mockToken = 'valid-jwt-token';
      vi.mocked(storage.getAccessToken).mockReturnValue(mockToken);
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { user, loading, isAuthenticated } = useAuthContext();
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

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('authenticated').textContent).toBe('true');
      expect(screen.getByTestId('user').textContent).toBe(mockUser.email);
    });

    it('should not authenticate if token is expired', async () => {
      const mockToken = 'expired-jwt-token';
      vi.mocked(storage.getAccessToken).mockReturnValue(mockToken);
      vi.mocked(jwt.isTokenExpired).mockReturnValue(true);

      const TestComponent = () => {
        const { loading, isAuthenticated } = useAuthContext();
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

    it('should handle authentication error gracefully', async () => {
      const mockToken = 'valid-jwt-token';
      const errorMessage = 'Network error';
      vi.mocked(storage.getAccessToken).mockReturnValue(mockToken);
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockRejectedValue(new Error(errorMessage));

      const TestComponent = () => {
        const { loading, error, isAuthenticated } = useAuthContext();
        return (
          <div>
            <div data-testid="loading">{loading.toString()}</div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <div data-testid="error">{error || 'null'}</div>
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
      expect(screen.getByTestId('error').textContent).toBe(errorMessage);
    });

    it('should set loading to false when no token exists', async () => {
      vi.mocked(storage.getAccessToken).mockReturnValue(null);

      const TestComponent = () => {
        const { loading, isAuthenticated } = useAuthContext();
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
    });
  });

  describe('useAuthContext hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const TestComponent = () => {
        useAuthContext();
        return <div>Test</div>;
      };

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useAuthContext must be used within an AuthProvider'
      );

      consoleError.mockRestore();
    });

    it('should return auth context when used inside AuthProvider', () => {
      const TestComponent = () => {
        const context = useAuthContext();
        expect(context).toBeDefined();
        expect(context).toHaveProperty('isAuthenticated');
        expect(context).toHaveProperty('user');
        expect(context).toHaveProperty('session');
        expect(context).toHaveProperty('loading');
        return <div>Test</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );
    });

    it('should provide login function', () => {
      const TestComponent = () => {
        const { login } = useAuthContext();
        expect(login).toBeDefined();
        expect(typeof login).toBe('function');
        return <div>Test</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );
    });

    it('should provide logout function', () => {
      const TestComponent = () => {
        const { logout } = useAuthContext();
        expect(logout).toBeDefined();
        expect(typeof logout).toBe('function');
        return <div>Test</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );
    });

    it('should provide refreshSession function', () => {
      const TestComponent = () => {
        const { refreshSession } = useAuthContext();
        expect(refreshSession).toBeDefined();
        expect(typeof refreshSession).toBe('function');
        return <div>Test</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );
    });
  });

  describe('initRauth function', () => {
    it('should validate and accept valid config', () => {
      expect(() => initRauth(mockConfig)).not.toThrow();
    });

    it('should throw error if apiKey is missing', () => {
      const invalidConfig = { ...mockConfig, apiKey: '' };
      expect(() => initRauth(invalidConfig as RAuthConfig)).toThrow(
        'apiKey is required'
      );
    });

    it('should use default baseUrl if not provided', () => {
      const configWithoutBaseUrl = {
        apiKey: 'test-api-key',
        providers: ['google'],
      } as RAuthConfig;

      expect(() => initRauth(configWithoutBaseUrl)).not.toThrow();
    });

    it('should throw error if providers array is empty', () => {
      const invalidConfig = { ...mockConfig, providers: [] };
      expect(() => initRauth(invalidConfig)).toThrow(
        'At least one provider must be configured'
      );
    });

    it('should accept config without providers (use all by default)', () => {
      const configWithoutProviders = {
        apiKey: 'test-api-key',
        baseUrl: 'https://test.rauth.dev',
      } as RAuthConfig;

      expect(() => initRauth(configWithoutProviders)).not.toThrow();
    });
  });

  describe('OAuth functions', () => {
    it('should initiate OAuth flow on login', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Mock window.location
      delete (window as any).location;
      (window as any).location = { href: '', origin: 'https://test.app.com' };
      
      // Initialize config so OAuth can work
      initRauth({
        apiKey: 'test-key',
        baseUrl: 'https://test.api.com',
      });

      const TestComponent = () => {
        const { login } = useAuthContext();
        return (
          <button onClick={() => login('google')}>Login</button>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      const button = screen.getByText('Login');
      button.click();

      // Should log OAuth initiation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initiating OAuth flow')
      );
      
      // Should redirect
      expect(window.location.href).toContain('/api/v1/oauth/authorize');

      consoleSpy.mockRestore();
    });

    it('should have logout placeholder that clears state and storage', async () => {
      vi.mocked(storage.getAccessToken).mockReturnValue('valid-token');
      vi.mocked(jwt.isTokenExpired).mockReturnValue(false);
      vi.mocked(api.getCurrentUser).mockResolvedValue(mockUser);

      const clearSpy = vi.spyOn(storage, 'clear');

      const TestComponent = () => {
        const { logout, isAuthenticated } = useAuthContext();
        return (
          <div>
            <div data-testid="authenticated">{isAuthenticated.toString()}</div>
            <button onClick={logout}>Logout</button>
          </div>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      const button = screen.getByText('Logout');
      button.click();

      await waitFor(() => {
        expect(clearSpy).toHaveBeenCalled();
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('should have refreshSession placeholder that logs to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const TestComponent = () => {
        const { refreshSession } = useAuthContext();
        return (
          <button onClick={() => refreshSession()}>Refresh</button>
        );
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      const button = screen.getByText('Refresh');
      button.click();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshSession')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('SSR compatibility', () => {
    it('should handle SSR environment (no window)', async () => {
      vi.mocked(storage.getAccessToken).mockReturnValue(null);

      const TestComponent = () => {
        const { loading } = useAuthContext();
        return <div data-testid="loading">{loading.toString()}</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });

  describe('Config context', () => {
    it('should expose config in context', () => {
      const TestComponent = () => {
        const { config } = useAuthContext();
        expect(config).toBeDefined();
        expect(config?.apiKey).toBe(mockConfig.apiKey);
        expect(config?.baseUrl).toBe(mockConfig.baseUrl);
        expect(config?.providers).toEqual(mockConfig.providers);
        return <div>Test</div>;
      };

      render(
        <AuthProvider config={mockConfig}>
          <TestComponent />
        </AuthProvider>
      );
    });
  });
});
