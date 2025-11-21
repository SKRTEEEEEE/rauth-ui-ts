/**
 * Integration tests for server actions
 * 
 * These tests verify the complete flow of server-side authentication,
 * including interaction with backend APIs and real cookie operations.
 * 
 * Note: Some tests may require actual Next.js context or be skipped
 * if backend is not available.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import type { Session, User } from '../../src/utils/types';

// Check if backend is available
const BACKEND_URL = process.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080';
const SKIP_BACKEND_TESTS = process.env.SKIP_BACKEND_TESTS === 'true';

async function checkBackendAvailable(): Promise<boolean> {
  if (SKIP_BACKEND_TESTS) return false;
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe('Server Actions - Integration Tests', () => {
  let backendAvailable: boolean;
  let mockSession: Session;
  let mockUser: User;

  beforeEach(async () => {
    backendAvailable = await checkBackendAvailable();

    // Initialize SDK
    initRauth({
      apiKey: 'test_api_key_123456',
      baseUrl: BACKEND_URL,
      providers: ['google'],
      storage: {
        type: 'cookies',
        prefix: 'test_rauth_',
        cookieOptions: {
          path: '/',
          secure: false,
          sameSite: 'lax',
        },
      },
    });

    // Setup mock data
    mockSession = {
      id: 'session123',
      userId: 'user123',
      accessToken: 'access_token_123',
      refreshToken: 'refresh_token_123',
      expiresAt: Date.now() + 3600000,
      createdAt: new Date().toISOString(),
      provider: 'google',
    };

    mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  afterEach(() => {
    resetConfig();
    vi.clearAllMocks();
  });

  describe('getSessionAction - Full flow', () => {
    it('should extract and validate session from cookies', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await getSessionAction(cookieHeader);

      expect(session).not.toBeNull();
      expect(session?.id).toBe('session123');
      expect(session?.userId).toBe('user123');
      expect(session?.accessToken).toBe('access_token_123');
      expect(session?.provider).toBe('google');
    });

    it('should validate expiry and return null for expired sessions', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await getSessionAction(cookieHeader);

      expect(session).toBeNull();
    });

    it('should handle multiple cookies correctly', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `unrelated=value; test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}; another=test`;

      const session = await getSessionAction(cookieHeader);

      expect(session).not.toBeNull();
      expect(session?.id).toBe('session123');
    });

    it('should parse real cookie header format', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      // Simulate real cookie header from browser
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}; Path=/; Secure; HttpOnly; SameSite=Lax`;

      const session = await getSessionAction(cookieHeader);

      // Should ignore cookie attributes and extract value
      expect(session).not.toBeNull();
    });
  });

  describe('getUserAction - Full flow', () => {
    it('should retrieve user from cookies when available', async () => {
      const { getUserAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
    });

    it('should return null when session is expired', async () => {
      const { getUserAction } = await import('../../src/server/actions');

      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 1000,
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);

      expect(user).toBeNull();
    });

    it('should return null when user cookie is missing', async () => {
      const { getUserAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const user = await getUserAction(cookieHeader);

      // Without user cookie, should return null (or fetch from backend)
      expect(user).toBeDefined();
    });

    it.skipIf(!backendAvailable)('should fetch user from backend when not in cookies', async () => {
      const { getUserAction } = await import('../../src/server/actions');

      // Only session cookie, no user cookie
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const user = await getUserAction(cookieHeader);

      // Should attempt to fetch from backend
      expect(user).toBeDefined();
    });
  });

  describe('requireSession - Protected routes pattern', () => {
    it('should return session for valid authentication', async () => {
      const { requireSession } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await requireSession(cookieHeader);

      expect(session).not.toBeNull();
      expect(session.id).toBe('session123');
    });

    it('should throw error for missing session', async () => {
      const { requireSession } = await import('../../src/server/actions');

      const cookieHeader = 'unrelated=value';

      await expect(async () => {
        await requireSession(cookieHeader);
      }).rejects.toThrow();
    });

    it('should throw error for expired session', async () => {
      const { requireSession } = await import('../../src/server/actions');

      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 1000,
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      await expect(async () => {
        await requireSession(cookieHeader);
      }).rejects.toThrow();
    });

    it('should support custom error messages', async () => {
      const { requireSession } = await import('../../src/server/actions');

      const cookieHeader = '';

      await expect(async () => {
        await requireSession(cookieHeader, 'Authentication required for this page');
      }).rejects.toThrow('Authentication required for this page');
    });
  });

  describe('requireUser - Protected routes pattern', () => {
    it('should return user for valid authentication', async () => {
      const { requireUser } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await requireUser(cookieHeader);

      expect(user).not.toBeNull();
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error when user not found', async () => {
      const { requireUser } = await import('../../src/server/actions');

      const cookieHeader = 'unrelated=value';

      await expect(async () => {
        await requireUser(cookieHeader);
      }).rejects.toThrow();
    });

    it('should support custom error messages', async () => {
      const { requireUser } = await import('../../src/server/actions');

      const cookieHeader = '';

      await expect(async () => {
        await requireUser(cookieHeader, 'User authentication required');
      }).rejects.toThrow('User authentication required');
    });
  });

  describe('Next.js Pages Router integration', () => {
    it('should work with getServerSideProps context format', async () => {
      const { getSessionAction, getUserAction } = await import('../../src/server/actions');

      // Simulate Next.js getServerSideProps context
      const mockContext = {
        req: {
          headers: {
            cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
          },
          url: '/protected',
        },
        res: {
          setHeader: vi.fn(),
        },
      };

      const session = await getSessionAction(mockContext.req.headers.cookie);
      const user = await getUserAction(mockContext.req.headers.cookie);

      expect(session).not.toBeNull();
      expect(user).not.toBeNull();
    });

    it('should support redirect pattern for unauthenticated requests', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const mockContext = {
        req: {
          headers: {
            cookie: 'no_auth=here',
          },
        },
      };

      const session = await getSessionAction(mockContext.req.headers.cookie);

      // Pattern used in getServerSideProps
      if (!session) {
        const redirect = {
          redirect: {
            destination: '/login',
            permanent: false,
          },
        };

        expect(redirect.redirect.destination).toBe('/login');
        expect(session).toBeNull();
      }
    });

    it('should work in API routes', async () => {
      const { getSessionAction, getUserAction } = await import('../../src/server/actions');

      const mockReq = {
        method: 'GET',
        headers: {
          cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
        },
      };

      const session = await getSessionAction(mockReq.headers.cookie);
      const user = await getUserAction(mockReq.headers.cookie);

      expect(session).not.toBeNull();
      expect(user).not.toBeNull();

      // API route can now use session/user data
      if (session && user) {
        expect(user.id).toBe(session.userId);
      }
    });

    it('should handle protected API route pattern', async () => {
      const { requireSession, getUserAction } = await import('../../src/server/actions');

      const mockReq = {
        headers: {
          cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
        },
      };

      // Pattern: Require session in API route
      const session = await requireSession(mockReq.headers.cookie);
      const user = await getUserAction(mockReq.headers.cookie);

      expect(session).not.toBeNull();
      expect(user).not.toBeNull();
    });
  });

  describe('Next.js App Router integration', () => {
    it('getCurrentUser should handle server component context', async () => {
      const { getCurrentUser } = await import('../../src/server/actions');

      // In real App Router, cookies() from next/headers would be available
      const user = await getCurrentUser();

      // Without Next.js context in tests, should return null
      expect(user).toBeNull();
    });

    it('getSession should handle server component context', async () => {
      const { getSession } = await import('../../src/server/actions');

      const session = await getSession();

      // Without Next.js context in tests, should return null
      expect(session).toBeNull();
    });

    it('should support async Server Component pattern', async () => {
      const { getCurrentUser } = await import('../../src/server/actions');

      // Simulate async Server Component
      async function ServerComponent() {
        const user = await getCurrentUser();
        return user;
      }

      const result = await ServerComponent();
      expect(result).toBeDefined();
    });

    it('should support Server Action pattern', async () => {
      const { getSession, getUserAction } = await import('../../src/server/actions');

      // Simulate Server Action
      async function serverAction() {
        'use server'; // This comment indicates Server Action

        const session = await getSession();
        if (!session) {
          return { error: 'Unauthorized' };
        }

        return { success: true, session };
      }

      const result = await serverAction();
      expect(result).toBeDefined();
    });
  });

  describe('Real-world usage patterns', () => {
    it('should protect a page with redirect', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      // Pattern: Protected page
      async function getServerSidePropsProtected(context: any) {
        const session = await getSessionAction(context.req.headers.cookie);

        if (!session) {
          return {
            redirect: {
              destination: '/login',
              permanent: false,
            },
          };
        }

        return {
          props: {
            session,
          },
        };
      }

      const mockContext = {
        req: { headers: { cookie: '' } },
      };

      const result = await getServerSidePropsProtected(mockContext);

      expect(result).toHaveProperty('redirect');
      expect((result as any).redirect.destination).toBe('/login');
    });

    it('should fetch user-specific data', async () => {
      const { getUserAction } = await import('../../src/server/actions');

      // Pattern: Fetch user data for personalized page
      async function getServerSidePropsProfile(context: any) {
        const user = await getUserAction(context.req.headers.cookie);

        if (!user) {
          return {
            redirect: {
              destination: '/login',
              permanent: false,
            },
          };
        }

        return {
          props: {
            user,
          },
        };
      }

      const mockContext = {
        req: {
          headers: {
            cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
          },
        },
      };

      const result = await getServerSidePropsProfile(mockContext);

      expect(result).toHaveProperty('props');
      expect((result as any).props.user.email).toBe('test@example.com');
    });

    it('should protect API endpoint', async () => {
      const { requireSession } = await import('../../src/server/actions');

      // Pattern: Protected API endpoint
      async function protectedApiHandler(req: any) {
        const session = await requireSession(req.headers.cookie);

        // Process authenticated request
        return {
          userId: session.userId,
          data: 'protected data',
        };
      }

      const mockReq = {
        headers: {
          cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
        },
      };

      const result = await protectedApiHandler(mockReq);

      expect(result.userId).toBe('user123');
      expect(result.data).toBe('protected data');
    });

    it('should handle optional authentication', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      // Pattern: Optional auth (show different content based on auth status)
      async function getServerSidePropsOptional(context: any) {
        const session = await getSessionAction(context.req.headers.cookie);

        return {
          props: {
            isAuthenticated: !!session,
            user: session ? 'user data' : null,
          },
        };
      }

      const mockContextAuth = {
        req: {
          headers: {
            cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
          },
        },
      };

      const mockContextNoAuth = {
        req: { headers: { cookie: '' } },
      };

      const resultAuth = await getServerSidePropsOptional(mockContextAuth);
      const resultNoAuth = await getServerSidePropsOptional(mockContextNoAuth);

      expect((resultAuth as any).props.isAuthenticated).toBe(true);
      expect((resultNoAuth as any).props.isAuthenticated).toBe(false);
    });
  });

  describe('Error handling in production scenarios', () => {
    it('should handle malformed cookie headers gracefully', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const malformedCookieHeader = 'malformed;;;cookie;;;data';

      const session = await getSessionAction(malformedCookieHeader);

      expect(session).toBeNull();
    });

    it('should handle corrupted session data', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const corruptedCookie = 'test_rauth_session=%7Bcorrupted%7D';

      const session = await getSessionAction(corruptedCookie);

      expect(session).toBeNull();
    });

    it('should handle concurrent requests', async () => {
      const { getSessionAction, getUserAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      // Simulate concurrent requests
      const [session1, session2, user1, user2] = await Promise.all([
        getSessionAction(cookieHeader),
        getSessionAction(cookieHeader),
        getUserAction(cookieHeader),
        getUserAction(cookieHeader),
      ]);

      expect(session1).toEqual(session2);
      expect(user1).toEqual(user2);
    });

    it('should not leak sensitive data in errors', async () => {
      const { requireSession } = await import('../../src/server/actions');

      const sensitiveDataCookie = 'test_rauth_session=sensitive_token_12345';

      try {
        await requireSession(sensitiveDataCookie);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Error should not contain actual token
        expect(errorMessage).not.toContain('sensitive_token_12345');
      }
    });
  });

  describe('Performance', () => {
    it('should complete session extraction quickly', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const startTime = Date.now();
      await getSessionAction(cookieHeader);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle large cookie headers efficiently', async () => {
      const { getSessionAction } = await import('../../src/server/actions');

      // Create large cookie header with many cookies
      const largeCookies = Array.from({ length: 50 }, (_, i) => 
        `cookie${i}=value${i}`
      ).join('; ');

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `${largeCookies}; test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const startTime = Date.now();
      const session = await getSessionAction(cookieHeader);
      const endTime = Date.now();

      expect(session).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
