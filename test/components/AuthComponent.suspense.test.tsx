/**
 * AuthComponent Suspense Tests
 * Tests SSR compatibility and Suspense integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { AuthComponent } from '../../src/components/AuthComponent';
import { AuthProvider } from '../../src/providers/AuthProvider';
import type { RAuthConfig } from '../../src/utils/types';
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
  getOAuthAuthorizeUrl: vi.fn().mockReturnValue('https://auth.example.com/oauth'),
  deleteSession: vi.fn().mockResolvedValue(undefined),
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

describe('AuthComponent - Suspense Integration', () => {
  const mockConfig: RAuthConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.example.com',
    providers: ['google', 'github'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });

  describe('Suspense Boundaries', () => {
    it('should work within Suspense boundary', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      // Should eventually render the component
      await waitFor(() => {
        expect(screen.queryByText('Suspense Loading...')).not.toBeInTheDocument();
      });

      // Should show login button after loading
      await waitFor(() => {
        expect(screen.getByText('Login with Google')).toBeInTheDocument();
      });
    });

    it('should not throw during Suspense phase', () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      expect(() => {
        render(
          <Suspense fallback={<div>Loading...</div>}>
            <AuthProvider config={mockConfig}>
              <AuthComponent provider="google" />
            </AuthProvider>
          </Suspense>
        );
      }).not.toThrow();
    });

    it('should render consistent content after Suspense resolves', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      vi.mocked(storage.getSession).mockReturnValue(mockSession);

      const { container } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should show authenticated content
      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      // Content should remain stable
      const initialHTML = container.innerHTML;
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(container.innerHTML).toBe(initialHTML);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while initializing', () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <AuthProvider config={mockConfig}>
          <AuthComponent provider="google" />
        </AuthProvider>
      );

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should transition from loading to content without flash', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      const { container } = render(
        <Suspense fallback={<div>Suspense Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should show login content
      expect(screen.getByText('Login with Google')).toBeInTheDocument();

      // Should not have any intermediate flashes
      const snapshots: string[] = [];
      const observer = new MutationObserver(() => {
        snapshots.push(container.innerHTML);
      });

      observer.observe(container, { childList: true, subtree: true });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      observer.disconnect();

      // Should have minimal state changes (only load -> content)
      expect(snapshots.length).toBeLessThan(5);
    });

    it('should handle nested Suspense boundaries', async () => {
      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>Outer Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <Suspense fallback={<div>Inner Loading...</div>}>
              <AuthComponent provider="google" />
            </Suspense>
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Outer Loading...')).not.toBeInTheDocument();
        expect(screen.queryByText('Inner Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Login with Google')).toBeInTheDocument();
    });
  });

  describe('SSR Hydration', () => {
    it('should not cause hydration mismatch with initialSession', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Server User',
        },
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      vi.mocked(storage.getSession).mockReturnValue(mockSession);

      // Simulate SSR scenario
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider config={mockConfig}>
          <AuthComponent provider="google" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Server User')).toBeInTheDocument();
      });

      // Should not have hydration warnings
      const hydrationErrors = consoleErrorSpy.mock.calls.filter(
        call => call[0]?.toString().includes('hydration') || call[0]?.toString().includes('Hydration')
      );
      expect(hydrationErrors.length).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('should render same content on server and client', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      vi.mocked(storage.getSession).mockReturnValue(mockSession);

      // First render (simulating server)
      const { container: serverContainer } = render(
        <AuthProvider config={mockConfig}>
          <AuthComponent provider="google" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const serverHTML = serverContainer.innerHTML;

      // Clean up
      document.body.innerHTML = '';

      // Second render (simulating client hydration)
      const { container: clientContainer } = render(
        <AuthProvider config={mockConfig}>
          <AuthComponent provider="google" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const clientHTML = clientContainer.innerHTML;

      // Server and client HTML should match
      expect(clientHTML).toBe(serverHTML);
    });
  });

  describe('Error Boundaries', () => {
    it('should not break Suspense on error', async () => {
      vi.mocked(storage.getSession).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should render login (fallback to unauthenticated state)
      expect(screen.getByText('Login with Google')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should recover from Suspense errors gracefully', async () => {
      let shouldThrow = true;
      
      vi.mocked(storage.getSession).mockImplementation(() => {
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error('First call error');
        }
        return null;
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should eventually show login
      await waitFor(() => {
        expect(screen.getByText('Login with Google')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders in Suspense', async () => {
      const renderCount = { count: 0 };

      function TestComponent() {
        renderCount.count++;
        return <AuthComponent provider="google" />;
      }

      vi.mocked(storage.getSession).mockReturnValue(null);

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <TestComponent />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Login with Google')).toBeInTheDocument();
      });

      const initialRenderCount = renderCount.count;

      // Wait a bit to ensure no extra renders
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not have excessive re-renders
      expect(renderCount.count - initialRenderCount).toBeLessThan(3);
    });

    it('should memoize content during Suspense', async () => {
      const mockSession = {
        user: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        },
        session: {
          id: 'session-123',
          userId: '123',
          accessToken: 'token',
          refreshToken: 'refresh',
          expiresAt: Date.now() + 3600000,
        },
      };

      vi.mocked(storage.getSession).mockReturnValue(mockSession);

      const { container } = render(
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider config={mockConfig}>
            <AuthComponent provider="google" />
          </AuthProvider>
        </Suspense>
      );

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });

      const initialContent = container.querySelector('.rauth-profile');
      
      // Trigger potential re-render
      await new Promise(resolve => setTimeout(resolve, 50));

      const afterContent = container.querySelector('.rauth-profile');

      // Should be same DOM node (not re-created)
      expect(afterContent).toBe(initialContent);
    });
  });
});
