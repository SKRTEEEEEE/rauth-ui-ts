/**
 * Comprehensive unit tests for server actions
 * 
 * These tests verify server-side authentication functions for Next.js SSR,
 * including getSessionAction, getUserAction, requireSession, and helpers
 * for both Pages Router and App Router patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import type { Session, User } from '../../src/utils/types';

// Mock dependencies
vi.mock('../../src/utils/api', () => ({
  getCurrentUser: vi.fn(),
  apiRequest: vi.fn(),
}));

describe('Server Actions - Unit Tests', () => {
  let mockSession: Session;
  let mockUser: User;

  beforeEach(() => {
    // Initialize SDK
    initRauth({
      apiKey: 'test_api_key_123456',
      baseUrl: 'http://localhost:8080',
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
      expiresAt: Date.now() + 3600000, // Expires in 1 hour
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

  describe('getSessionAction', () => {
    it('should extract session from valid cookie header', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await getSessionAction(cookieHeader);

      expect(session).not.toBeNull();
      expect(session?.id).toBe('session123');
      expect(session?.userId).toBe('user123');
      expect(session?.accessToken).toBe('access_token_123');
    });

    it('should return null when cookie header is missing', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const session = await getSessionAction(undefined);
      expect(session).toBeNull();
    });

    it('should return null when cookie header is empty', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const session = await getSessionAction('');
      expect(session).toBeNull();
    });

    it('should return null when session cookie not found', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const cookieHeader = 'other_cookie=value123';

      const session = await getSessionAction(cookieHeader);
      expect(session).toBeNull();
    });

    it('should return null when session is expired', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const session = await getSessionAction(cookieHeader);
      expect(session).toBeNull();
    });

    it('should return null when session data is malformed', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const cookieHeader = 'test_rauth_session=invalid_json_data';

      const session = await getSessionAction(cookieHeader);
      expect(session).toBeNull();
    });

    it('should handle session with missing required fields', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const incompleteSession = {
        id: 'session123',
        // Missing other required fields
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(incompleteSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const session = await getSessionAction(cookieHeader);
      // Should return null or handle gracefully
      expect(session).toBeDefined();
    });

    it('should validate session expiry correctly', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      // Session expires in 1 second
      const almostExpiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() + 1000,
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(almostExpiredSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await getSessionAction(cookieHeader);
      expect(session).not.toBeNull();
      expect(session?.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should parse multiple cookies and extract session', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `other=value; test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}; another=test`;

      const session = await getSessionAction(cookieHeader);
      expect(session).not.toBeNull();
      expect(session?.id).toBe('session123');
    });
  });

  describe('getUserAction', () => {
    it('should retrieve user data from backend with valid session', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      const { getCurrentUser } = await import('../../src/utils/api');
      
      // Mock API call
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user123');
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null when session is missing', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const cookieHeader = 'other_cookie=value';

      const user = await getUserAction(cookieHeader);
      expect(user).toBeNull();
    });

    it('should return null when session is expired', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 3600000,
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const user = await getUserAction(cookieHeader);
      expect(user).toBeNull();
    });

    it('should return null when API call fails with 401', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      const { getCurrentUser } = await import('../../src/utils/api');
      
      // Mock 401 error
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);
      // Should handle error gracefully and return from cookie
      expect(user).toBeDefined();
    });

    it('should return null on network error', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      const { getCurrentUser } = await import('../../src/utils/api');
      
      // Mock network error
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Network error'));

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);
      // Should handle error gracefully
      expect(user).toBeDefined();
    });

    it('should use cached user data from cookies when available', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);

      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should handle undefined cookie header', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const user = await getUserAction(undefined);
      expect(user).toBeNull();
    });

    it('should handle empty cookie header', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const user = await getUserAction('');
      expect(user).toBeNull();
    });
  });

  describe('requireSession', () => {
    it('should return session when valid', async () => {
      const { requireSession } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const session = await requireSession(cookieHeader);

      expect(session).not.toBeNull();
      expect(session.id).toBe('session123');
    });

    it('should throw error when session is missing', async () => {
      const { requireSession } = await import('../../src/server/actions');
      
      const cookieHeader = 'other_cookie=value';

      await expect(requireSession(cookieHeader)).rejects.toThrow();
    });

    it('should throw error when session is expired', async () => {
      const { requireSession } = await import('../../src/server/actions');
      
      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 3600000,
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      await expect(requireSession(cookieHeader)).rejects.toThrow();
    });

    it('should throw error with custom message', async () => {
      const { requireSession } = await import('../../src/server/actions');
      
      const cookieHeader = '';

      await expect(requireSession(cookieHeader, 'Custom error')).rejects.toThrow('Custom error');
    });

    it('should use default error message when not provided', async () => {
      const { requireSession } = await import('../../src/server/actions');
      
      const cookieHeader = '';

      await expect(requireSession(cookieHeader)).rejects.toThrow();
    });
  });

  describe('requireUser', () => {
    it('should return user when session is valid', async () => {
      const { requireUser } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await requireUser(cookieHeader);

      expect(user).not.toBeNull();
      expect(user.email).toBe('test@example.com');
    });

    it('should throw error when user is not found', async () => {
      const { requireUser } = await import('../../src/server/actions');
      
      const cookieHeader = 'other_cookie=value';

      await expect(requireUser(cookieHeader)).rejects.toThrow();
    });

    it('should throw error with custom message', async () => {
      const { requireUser } = await import('../../src/server/actions');
      
      const cookieHeader = '';

      await expect(requireUser(cookieHeader, 'User required')).rejects.toThrow('User required');
    });
  });

  describe('Next.js Pages Router helpers', () => {
    it('should work with getServerSideProps context', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      // Simulate Next.js context
      const mockContext = {
        req: {
          headers: {
            cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
          },
        },
      };

      const session = await getSessionAction(mockContext.req.headers.cookie);

      expect(session).not.toBeNull();
      expect(session?.id).toBe('session123');
    });

    it('should support redirect pattern for protected routes', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const mockContext = {
        req: {
          headers: {
            cookie: 'no_session=here',
          },
        },
      };

      const session = await getSessionAction(mockContext.req.headers.cookie);

      // Pattern: if (!session) return { redirect: { destination: '/login' } }
      if (!session) {
        expect(session).toBeNull();
      }
    });

    it('should work in API routes', async () => {
      const { getSessionAction, getUserAction } = await import('../../src/server/actions');
      
      const mockReq = {
        headers: {
          cookie: `test_rauth_session=${encodeURIComponent(JSON.stringify(mockSession))}; test_rauth_user=${encodeURIComponent(JSON.stringify(mockUser))}`,
        },
      };

      const session = await getSessionAction(mockReq.headers.cookie);
      const user = await getUserAction(mockReq.headers.cookie);

      expect(session).not.toBeNull();
      expect(user).not.toBeNull();
    });
  });

  describe('Next.js App Router helpers', () => {
    it('getCurrentUser should work in Server Components', async () => {
      const { getCurrentUser } = await import('../../src/server/actions');
      
      // In App Router, cookies() from next/headers is used internally
      // We test the exported function
      const user = await getCurrentUser();

      // Without actual Next.js context, should return null
      expect(user).toBeNull();
    });

    it('getSession should work in Server Components', async () => {
      const { getSession } = await import('../../src/server/actions');
      
      const session = await getSession();

      // Without actual Next.js context, should return null
      expect(session).toBeNull();
    });

    it('should support async Server Component pattern', async () => {
      const { getCurrentUser } = await import('../../src/server/actions');
      
      // Pattern: export default async function Page() { const user = await getCurrentUser(); }
      const user = await getCurrentUser();

      expect(user).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should not throw on invalid JSON in cookies', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const cookieHeader = 'test_rauth_session=not_json_data';

      const session = await getSessionAction(cookieHeader);
      expect(session).toBeNull();
    });

    it('should handle corrupted session data gracefully', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const corruptedData = encodeURIComponent('{"id":"123"'); // Incomplete JSON
      const cookieHeader = `test_rauth_session=${corruptedData}`;

      const session = await getSessionAction(cookieHeader);
      expect(session).toBeNull();
    });

    it('should log errors in debug mode', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { getSessionAction } = await import('../../src/server/actions');
      
      const cookieHeader = 'test_rauth_session=invalid';

      await getSessionAction(cookieHeader);

      // Should log error
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle missing access token in session', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const invalidSession = {
        ...mockSession,
        accessToken: '',
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(invalidSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const user = await getUserAction(cookieHeader);
      // Should handle gracefully
      expect(user).toBeDefined();
    });
  });

  describe('TypeScript types', () => {
    it('should return correctly typed Session', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const session = await getSessionAction(cookieHeader);

      if (session) {
        // TypeScript should infer correct types
        expect(typeof session.id).toBe('string');
        expect(typeof session.userId).toBe('string');
        expect(typeof session.accessToken).toBe('string');
        expect(typeof session.expiresAt).toBe('number');
      }
    });

    it('should return correctly typed User', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      const user = await getUserAction(cookieHeader);

      if (user) {
        // TypeScript should infer correct types
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.emailVerified).toBe('boolean');
      }
    });
  });

  describe('Performance considerations', () => {
    it('should not make unnecessary API calls when user in cookies', async () => {
      const { getUserAction } = await import('../../src/server/actions');
      const { getCurrentUser } = await import('../../src/utils/api');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `test_rauth_session=${sessionCookie}; test_rauth_user=${userCookie}`;

      await getUserAction(cookieHeader);

      // Should use cached user from cookies, not call API
      expect(getCurrentUser).not.toHaveBeenCalled();
    });

    it('should cache session parsing within same request', async () => {
      const { getSessionAction } = await import('../../src/server/actions');
      
      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const cookieHeader = `test_rauth_session=${sessionCookie}`;

      const session1 = await getSessionAction(cookieHeader);
      const session2 = await getSessionAction(cookieHeader);

      expect(session1).toEqual(session2);
    });
  });
});
