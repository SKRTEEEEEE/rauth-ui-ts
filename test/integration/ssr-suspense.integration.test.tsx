/**
 * SSR + Suspense Integration Tests
 * Tests complete SSR flow with Suspense boundaries
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { AuthProvider } from '../../src/providers/AuthProvider';
import { AuthComponent } from '../../src/components/AuthComponent';
import { useAuth } from '../../src/hooks/useAuth';
import type { RAuthConfig, User, Session } from '../../src/utils/types';
import * as storage from '../../src/utils/storage';
import * as api from '../../src/utils/api';

// Mock dependencies
vi.mock('../../src/utils/storage');
vi.mock('../../src/utils/api');
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

// Test component simulating async Server Component
function AsyncServerComponent({ initialSession }: { initialSession: { user: User; session: Session } | null }) {
  return (
    <AuthProvider config={mockConfig} initialSession={initialSession}>
      <Suspense fallback={<div>Loading auth...</div>}>
        <AuthContent />
      </Suspense>
    </AuthProvider>
  );
}

function AuthContent() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    return (
      <div>
        <h1>Protected Content</h1>
        <p>Welcome, {user.name}!</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Public Content</h1>
      <AuthComponent provider="google" />
    </div>
  );
}

const mockConfig: RAuthConfig = {
  apiKey: 'test-api-key',
  baseUrl: 'https://api.example.com',
  providers: ['google', 'github'],
};

describe('SSR + Suspense Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server-Side Rendering', () => {
    it('should render authenticated content on server with initialSession', async () => {
      const serverSession = {
        user: {
          id: '123',
          email: 'server@example.com',
          name: 'Server User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'server-token',
          refreshToken: 'server-refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(<AsyncServerComponent initialSession={serverSession} />);

      // Should render authenticated content immediately
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.getByText('Welcome, Server User!')).toBeInTheDocument();
    });

    it('should render login content on server without initialSession', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(<AsyncServerComponent initialSession={null} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading auth...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(screen.getByText('Login with Google')).toBeInTheDocument();
    });

    it('should handle SSR with Suspense boundary', async () => {
      const serverSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'SSR User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      const { container } = render(
        <Suspense fallback={<div>App Loading...</div>}>
          <AsyncServerComponent initialSession={serverSession} />
        </Suspense>
      );

      // Should not show app-level Suspense fallback
      expect(screen.queryByText('App Loading...')).not.toBeInTheDocument();
      
      // Should render content immediately
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  describe('Client-Side Hydration', () => {
    it('should hydrate without mismatch using initialSession', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Hydration User',
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
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(storage.getSession).mockReturnValue(initialSession);

      render(<AsyncServerComponent initialSession={initialSession} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, Hydration User!')).toBeInTheDocument();
      });

      // Check for hydration warnings
      const hydrationIssues = [
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
      ].filter(
        call => {
          const message = call[0]?.toString() || '';
          return message.includes('hydration') || 
                 message.includes('Hydration') || 
                 message.includes('did not match');
        }
      );

      expect(hydrationIssues.length).toBe(0);

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should match server and client render output', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Match User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(initialSession);

      // Server render
      const { container: serverContainer } = render(
        <AsyncServerComponent initialSession={initialSession} />
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, Match User!')).toBeInTheDocument();
      });

      const serverHTML = serverContainer.innerHTML;

      // Clean up
      document.body.innerHTML = '';

      // Client render
      const { container: clientContainer } = render(
        <AsyncServerComponent initialSession={initialSession} />
      );

      await waitFor(() => {
        expect(screen.getByText('Welcome, Match User!')).toBeInTheDocument();
      });

      const clientHTML = clientContainer.innerHTML;

      // Should match exactly
      expect(clientHTML).toBe(serverHTML);
    });

    it('should not flash unauthenticated content during hydration', async () => {
      const initialSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'No Flash User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      const { container } = render(<AsyncServerComponent initialSession={initialSession} />);

      // Should show authenticated content
      expect(screen.getByText('Protected Content')).toBeInTheDocument();

      // Content snapshots to detect flashing
      const snapshots: string[] = [container.innerHTML];
      
      const observer = new MutationObserver(() => {
        snapshots.push(container.innerHTML);
      });

      observer.observe(container, { childList: true, subtree: true });

      await new Promise(resolve => setTimeout(resolve, 200));
      observer.disconnect();

      // Should never contain "Public Content" or login button
      const hasFlash = snapshots.some(html => 
        html.includes('Public Content') || html.includes('Login with Google')
      );

      expect(hasFlash).toBe(false);
    });
  });

  describe('Streaming SSR', () => {
    it('should support streaming with nested Suspense', async () => {
      function StreamingComponent({ initialSession }: { initialSession: { user: User; session: Session } | null }) {
        return (
          <AuthProvider config={mockConfig} initialSession={initialSession}>
            <Suspense fallback={<div>Loading header...</div>}>
              <header>Header</header>
            </Suspense>
            <Suspense fallback={<div>Loading content...</div>}>
              <AuthContent />
            </Suspense>
            <Suspense fallback={<div>Loading footer...</div>}>
              <footer>Footer</footer>
            </Suspense>
          </AuthProvider>
        );
      }

      const session = {
        user: {
          id: '123',
          email: 'stream@example.com',
          name: 'Stream User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(<StreamingComponent initialSession={session} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading header...')).not.toBeInTheDocument();
        expect(screen.queryByText('Loading content...')).not.toBeInTheDocument();
        expect(screen.queryByText('Loading footer...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });

    it('should handle partial streaming failures gracefully', async () => {
      function PartialFailureComponent({ initialSession }: { initialSession: { user: User; session: Session } | null }) {
        return (
          <AuthProvider config={mockConfig} initialSession={initialSession}>
            <Suspense fallback={<div>Loading...</div>}>
              <div>Safe Content</div>
            </Suspense>
            <Suspense fallback={<div>Loading auth...</div>}>
              <AuthContent />
            </Suspense>
          </AuthProvider>
        );
      }

      const session = {
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

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(<PartialFailureComponent initialSession={session} />);

      await waitFor(() => {
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show consistent loading states in SSR', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>App Suspense...</div>}>
          <AuthProvider config={mockConfig}>
            <Suspense fallback={<div>Content Suspense...</div>}>
              <AuthContent />
            </Suspense>
          </AuthProvider>
        </Suspense>
      );

      // Wait for all loading to complete
      await waitFor(() => {
        expect(screen.queryByText('App Suspense...')).not.toBeInTheDocument();
        expect(screen.queryByText('Content Suspense...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });

    it('should transition smoothly from Suspense to content', async () => {
      const session = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Smooth User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      const { container } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <AsyncServerComponent initialSession={session} />
        </Suspense>
      );

      // Should not show Suspense fallback when using initialSession
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      
      // Should show content immediately
      expect(screen.getByText('Protected Content')).toBeInTheDocument();

      // Verify smooth transition (no intermediate states)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(container.innerHTML).toContain('Protected Content');
    });
  });

  describe('Error Handling', () => {
    it('should handle SSR errors gracefully', async () => {
      vi.mocked(storage.getSession).mockImplementation(() => {
        throw new Error('SSR Storage Error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <AsyncServerComponent initialSession={null} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should fallback to login
      await waitFor(() => {
        expect(screen.getByText('Public Content')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not break Suspense boundaries on error', async () => {
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
        <Suspense fallback={<div>Error Boundary Loading...</div>}>
          <AsyncServerComponent initialSession={malformedSession} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Error Boundary Loading...')).not.toBeInTheDocument();
      });

      // Should render something (fallback to unauthenticated)
      await waitFor(() => {
        expect(screen.getByText('Public Content')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders during SSR', async () => {
      let renderCount = 0;

      function RenderCounterContent() {
        renderCount++;
        const { isAuthenticated, user } = useAuth();

        if (isAuthenticated && user) {
          return <div>Authenticated: {user.name}</div>;
        }

        return <div>Not Authenticated</div>;
      }

      const session = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Perf User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <AuthProvider config={mockConfig} initialSession={session}>
          <Suspense fallback={<div>Loading...</div>}>
            <RenderCounterContent />
          </Suspense>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Authenticated: Perf User')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount;

      // Wait and check for unnecessary re-renders
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should have minimal re-renders (ideally 2-3: initial + hydration + settled)
      expect(renderCount - initialRenderCount).toBeLessThan(3);
    });

    it('should optimize Suspense boundary performance', async () => {
      const start = performance.now();

      const session = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Fast User',
        } as User,
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        } as Session,
      };

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <AsyncServerComponent initialSession={session} />
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      const end = performance.now();
      const duration = end - start;

      // Should be fast (< 100ms for synchronous rendering with initialSession)
      expect(duration).toBeLessThan(100);
    });
  });
});
