/**
 * AuthProvider Suspense Tests
 * Tests for Suspense compatibility and initialSession prop
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { AuthProvider } from '../../src/providers/AuthProvider';
import { useAuth } from '../../src/hooks/useAuth';
import type { RAuthConfig, User, Session } from '../../src/utils/types';
import * as storage from '../../src/utils/storage';

// Mock dependencies
vi.mock('../../src/utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getSessionId: vi.fn(),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setSessionId: vi.fn(),
    clear: vi.fn(),
  },
  getSession: vi.fn(),
}));

vi.mock('../../src/utils/api', () => ({
  getCurrentUser: vi.fn().mockResolvedValue({
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
  }),
}));

vi.mock('../../src/utils/jwt', () => ({
  isTokenExpired: vi.fn().mockReturnValue(false),
  decodeToken: vi.fn().mockReturnValue({
    sub: '123',
    exp: Date.now() + 3600000,
  }),
}));

vi.mock('../../src/utils/config', () => ({
  isConfigured: vi.fn().mockReturnValue(true),
  getConfig: vi.fn().mockReturnValue({
    apiKey: 'test-key',
    baseUrl: 'https://api.example.com',
    providers: ['google', 'github'],
  }),
}));

// Test component to consume auth context
function TestConsumer() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Auth Loading...</div>;
  }

  if (isAuthenticated && user) {
    return <div>Authenticated: {user.name}</div>;
  }

  return <div>Not Authenticated</div>;
}

describe('AuthProvider - Suspense Integration', () => {
  const mockConfig: RAuthConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.example.com',
    providers: ['google', 'github'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('initialSession Prop', () => {
    it('should accept initialSession prop', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'initial@example.com',
          name: 'Initial User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'initial-token',
          refreshToken: 'initial-refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should use initialSession immediately without loading
      expect(screen.queryByText('Auth Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Authenticated: Initial User')).toBeInTheDocument();
    });

    it('should skip loading state when initialSession is provided', () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      const { container } = render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should never show loading state
      expect(container.innerHTML).not.toContain('Auth Loading...');
      expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();
    });

    it('should use initialSession over storage session', async () => {
      const storageSession = {
        user: {
          id: '456',
          email: 'storage@example.com',
          name: 'Storage User',
        } as User,
        session: {
          id: 'session-456',
          userId: '456',
          accessToken: 'storage-token',
          refreshToken: 'storage-refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      const initialSession = {
        user: {
          id: '123',
          email: 'initial@example.com',
          name: 'Initial User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'initial-token',
          refreshToken: 'initial-refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(storageSession);

      render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should use initialSession, not storage
      expect(screen.getByText('Authenticated: Initial User')).toBeInTheDocument();
      expect(screen.queryByText('Authenticated: Storage User')).not.toBeInTheDocument();
    });

    it('should handle null initialSession', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <AuthProvider config={mockConfig} initialSession={null}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Auth Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
    });

    it('should handle undefined initialSession (fallback to storage)', async () => {
      const storageSession = {
        user: {
          id: '123',
          email: 'storage@example.com',
          name: 'Storage User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(storageSession);

      render(
        <AuthProvider config={mockConfig}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated: Storage User')).toBeInTheDocument();
      });
    });
  });

  describe('Suspense Compatibility', () => {
    it('should work within Suspense boundary', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <TestConsumer />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Suspense Loading...')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });

    it('should not throw during Suspense phase', () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      expect(() => {
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <AuthProvider config={mockConfig}>
              <TestConsumer />
            </AuthProvider>
          </Suspense>
        );
      }).not.toThrow();
    });

    it('should handle initialSession in Suspense', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      render(
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <AuthProvider config={mockConfig} initialSession={initialSession}>
            <TestConsumer />
          </AuthProvider>
        </Suspense>
      );

      // Should not show Suspense fallback
      expect(screen.queryByText('Suspense Loading...')).not.toBeInTheDocument();
      
      // Should show authenticated content immediately
      expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();
    });
  });

  describe('SSR Hydration', () => {
    it('should prevent hydration mismatch with initialSession', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Server User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated: Server User')).toBeInTheDocument();
      });

      // Check for hydration errors
      const hydrationErrors = consoleErrorSpy.mock.calls.filter(
        call => call[0]?.toString().includes('hydration') || call[0]?.toString().includes('Hydration')
      );
      expect(hydrationErrors.length).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('should render same content on server and client with initialSession', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      // First render (server)
      const { container: serverContainer } = render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();
      });

      const serverHTML = serverContainer.innerHTML;

      // Clean up
      document.body.innerHTML = '';

      // Second render (client)
      const { container: clientContainer } = render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();
      });

      const clientHTML = clientContainer.innerHTML;

      // Should match
      expect(clientHTML).toBe(serverHTML);
    });

    it('should avoid flash of unauthenticated content', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      const { container } = render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should never show "Not Authenticated"
      expect(container.innerHTML).not.toContain('Not Authenticated');
      expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();

      // Wait and verify no flash occurred
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(container.innerHTML).not.toContain('Not Authenticated');
    });
  });

  describe('Loading State Management', () => {
    it('should set loading=false immediately with initialSession', () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      render(
        <AuthProvider config={mockConfig} initialSession={initialSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should not show loading
      expect(screen.queryByText('Auth Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Authenticated: Test User')).toBeInTheDocument();
    });

    it('should transition from loading to loaded without initialSession', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <AuthProvider config={mockConfig}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should show loading initially
      expect(screen.getByText('Auth Loading...')).toBeInTheDocument();

      // Should transition to not authenticated
      await waitFor(() => {
        expect(screen.queryByText('Auth Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle expired session in initialSession', async () => {
      const expiredSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() - 1000, // Expired
        } as Session,
      };

      render(
        <AuthProvider config={mockConfig} initialSession={expiredSession}>
          <TestConsumer />
        </AuthProvider>
      );

      // Should not be authenticated with expired session
      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });
    });

    it('should handle malformed initialSession gracefully', async () => {
      const malformedSession = {
        user: null as any,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider config={mockConfig} initialSession={malformedSession}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not Authenticated')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
