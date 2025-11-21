/**
 * Integration tests for SSR cookie functionality
 * 
 * These tests verify end-to-end SSR cookie workflows including
 * session persistence, authentication state across server/client,
 * and Next.js integration scenarios.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initRauth, resetConfig } from '../../src/utils/config';
import type { Session, User } from '../../src/utils/types';

// Import storage utilities
import {
  isServer,
  setCookieServer,
  getCookieServer,
  getSessionFromCookies,
  saveSession,
  getSession,
  clearSession,
  getCookie,
  setCookie,
} from '../../src/utils/storage';

describe('SSR Cookie Integration Tests', () => {
  let mockSession: Session;
  let mockUser: User;

  beforeEach(() => {
    // Initialize SDK with cookie storage for SSR
    initRauth({
      apiKey: 'pk_test_integration',
      providers: ['google', 'github'],
      storage: {
        type: 'cookies',
        prefix: 'rauth_',
        cookieOptions: {
          path: '/',
          secure: true,
          sameSite: 'lax',
          maxAge: 86400, // 24 hours
        },
      },
    });

    // Create mock data
    mockSession = {
      id: 'sess_test123',
      userId: 'user_test123',
      accessToken: 'test_access_token_abc123',
      refreshToken: 'test_refresh_token_xyz789',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      createdAt: new Date().toISOString(),
      provider: 'google',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    };

    mockUser = {
      id: 'user_test123',
      email: 'integration@test.com',
      name: 'Integration Test User',
      avatar: 'https://example.com/avatar.jpg',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'integration_test',
      },
    };

    // Clear storage
    clearSession();
  });

  afterEach(() => {
    resetConfig();
    clearSession();
    vi.restoreAllMocks();
  });

  describe('Client-to-Server session handoff', () => {
    it('should persist session from client and retrieve on server', () => {
      // Client-side: Save session
      saveSession(mockSession, mockUser);

      // Verify client-side retrieval
      const clientSession = getSession();
      expect(clientSession).not.toBeNull();
      expect(clientSession?.user.email).toBe('integration@test.com');

      // Simulate server-side: Build cookie header from document.cookie
      const cookieHeader = document.cookie;

      // Server-side: Retrieve session from cookies
      const serverSession = getSessionFromCookies(cookieHeader);
      expect(serverSession).not.toBeNull();
      expect(serverSession?.user.email).toBe('integration@test.com');
      expect(serverSession?.session.accessToken).toBe(mockSession.accessToken);
    });

    it('should maintain session integrity across client/server boundary', () => {
      // Client saves session
      saveSession(mockSession, mockUser);

      // Get cookie header
      const cookieHeader = document.cookie;

      // Server reads session
      const serverSession = getSessionFromCookies(cookieHeader);

      // Verify all fields are preserved
      expect(serverSession?.session).toEqual(mockSession);
      expect(serverSession?.user).toEqual(mockUser);
    });
  });

  describe('Server-to-Client session handoff', () => {
    it('should create session on server and make it available to client', () => {
      // Server-side: Create Set-Cookie headers
      const sessionCookie = setCookieServer('session', mockSession, {
        httpOnly: false, // Allow client access for this test
        secure: true,
        sameSite: 'lax',
        maxAge: 3600,
      });

      const userCookie = setCookieServer('user', mockUser, {
        httpOnly: false,
        secure: true,
        sameSite: 'lax',
        maxAge: 3600,
      });

      // Simulate browser setting cookies (parse Set-Cookie headers)
      // In real scenario, browser would set these automatically
      const sessionMatch = sessionCookie.match(/rauth_session=([^;]+)/);
      const userMatch = userCookie.match(/rauth_user=([^;]+)/);

      if (sessionMatch && userMatch) {
        document.cookie = `rauth_session=${sessionMatch[1]}; path=/`;
        document.cookie = `rauth_user=${userMatch[1]}; path=/`;
      }

      // Client-side: Retrieve session
      const clientSession = getSession();
      expect(clientSession).not.toBeNull();
      expect(clientSession?.user.email).toBe('integration@test.com');
    });
  });

  describe('Session expiration handling', () => {
    it('should return null for expired session on server', () => {
      const expiredSession: Session = {
        ...mockSession,
        expiresAt: Date.now() - 3600000, // Expired 1 hour ago
      };

      // Create cookie with expired session
      const sessionCookie = encodeURIComponent(JSON.stringify(expiredSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `rauth_session=${sessionCookie}; rauth_user=${userCookie}`;

      // Server should return null for expired session
      const result = getSessionFromCookies(cookieHeader);
      expect(result).toBeNull();
    });

    it('should return valid session when not expired', () => {
      const validSession: Session = {
        ...mockSession,
        expiresAt: Date.now() + 7200000, // Valid for 2 hours
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(validSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `rauth_session=${sessionCookie}; rauth_user=${userCookie}`;

      const result = getSessionFromCookies(cookieHeader);
      expect(result).not.toBeNull();
      expect(result?.session.id).toBe(validSession.id);
    });
  });

  describe('Next.js getServerSideProps simulation', () => {
    it('should extract session in getServerSideProps pattern', () => {
      // Client saves session
      saveSession(mockSession, mockUser);

      // Simulate Next.js request object
      const mockRequest = {
        headers: {
          cookie: document.cookie,
        },
        url: '/dashboard',
        method: 'GET',
      };

      // getServerSideProps implementation
      const getServerSideProps = (req: typeof mockRequest) => {
        const sessionData = getSessionFromCookies(req.headers.cookie);
        
        return {
          props: {
            session: sessionData?.session || null,
            user: sessionData?.user || null,
          },
        };
      };

      // Execute
      const result = getServerSideProps(mockRequest);

      // Verify
      expect(result.props.session).not.toBeNull();
      expect(result.props.user?.email).toBe('integration@test.com');
    });

    it('should return null props when no session exists', () => {
      const mockRequest = {
        headers: {
          cookie: '',
        },
        url: '/dashboard',
        method: 'GET',
      };

      const getServerSideProps = (req: typeof mockRequest) => {
        const sessionData = getSessionFromCookies(req.headers.cookie);
        
        return {
          props: {
            session: sessionData?.session || null,
            user: sessionData?.user || null,
          },
        };
      };

      const result = getServerSideProps(mockRequest);

      expect(result.props.session).toBeNull();
      expect(result.props.user).toBeNull();
    });
  });

  describe('Next.js API Route simulation', () => {
    it('should set session cookie in API route', () => {
      const mockResponse = {
        headers: new Map<string, string | string[]>(),
        setHeader(name: string, value: string | string[]) {
          this.headers.set(name, value);
        },
        getHeader(name: string) {
          return this.headers.get(name);
        },
      };

      // API route handler
      const loginHandler = (res: typeof mockResponse) => {
        // Set session cookies
        const cookies: string[] = [];

        const sessionCookie = setCookieServer('session', mockSession, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 86400,
        });

        const userCookie = setCookieServer('user', mockUser, {
          httpOnly: false, // Client needs to read user data
          secure: true,
          sameSite: 'lax',
          maxAge: 86400,
        });

        cookies.push(sessionCookie, userCookie);
        res.setHeader('Set-Cookie', cookies);

        return { success: true };
      };

      // Execute
      const result = loginHandler(mockResponse);

      // Verify
      expect(result.success).toBe(true);
      const setCookieHeaders = mockResponse.getHeader('Set-Cookie');
      expect(setCookieHeaders).toBeDefined();
      
      if (Array.isArray(setCookieHeaders)) {
        expect(setCookieHeaders).toHaveLength(2);
        expect(setCookieHeaders[0]).toContain('rauth_session=');
        expect(setCookieHeaders[0]).toContain('HttpOnly');
        expect(setCookieHeaders[1]).toContain('rauth_user=');
      }
    });

    it('should clear session cookie in logout API route', () => {
      const mockResponse = {
        headers: new Map<string, string | string[]>(),
        setHeader(name: string, value: string | string[]) {
          this.headers.set(name, value);
        },
        getHeader(name: string) {
          return this.headers.get(name);
        },
      };

      // Logout handler
      const logoutHandler = (res: typeof mockResponse) => {
        const cookies: string[] = [];

        // Clear cookies by setting maxAge=0
        const clearSession = setCookieServer('session', '', {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 0,
        });

        const clearUser = setCookieServer('user', '', {
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          maxAge: 0,
        });

        cookies.push(clearSession, clearUser);
        res.setHeader('Set-Cookie', cookies);

        return { success: true };
      };

      // Execute
      const result = logoutHandler(mockResponse);

      // Verify
      expect(result.success).toBe(true);
      const setCookieHeaders = mockResponse.getHeader('Set-Cookie');
      
      if (Array.isArray(setCookieHeaders)) {
        expect(setCookieHeaders).toHaveLength(2);
        setCookieHeaders.forEach(header => {
          expect(header).toContain('Max-Age=0');
        });
      }
    });
  });

  describe('Security and CSRF protection', () => {
    it('should include CSRF protection flags in cookies', () => {
      const cookieString = setCookieServer('session', mockSession, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      expect(cookieString).toContain('HttpOnly');
      expect(cookieString).toContain('Secure');
      expect(cookieString).toContain('SameSite=Strict');
    });

    it('should support lax sameSite for better compatibility', () => {
      const cookieString = setCookieServer('session', mockSession, {
        sameSite: 'lax',
      });

      expect(cookieString).toMatch(/SameSite=Lax/i);
    });

    it('should enforce secure flag in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const cookieString = setCookieServer('session', mockSession);

      expect(cookieString).toContain('Secure');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Multiple provider sessions', () => {
    it('should handle sessions from different providers', () => {
      const googleSession: Session = {
        ...mockSession,
        id: 'sess_google',
        provider: 'google',
      };

      const githubSession: Session = {
        ...mockSession,
        id: 'sess_github',
        provider: 'github',
      };

      // Test Google session
      const googleCookie = encodeURIComponent(JSON.stringify(googleSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const googleHeader = `rauth_session=${googleCookie}; rauth_user=${userCookie}`;

      const googleResult = getSessionFromCookies(googleHeader);
      expect(googleResult?.session.provider).toBe('google');

      // Test GitHub session
      const githubCookie = encodeURIComponent(JSON.stringify(githubSession));
      const githubHeader = `rauth_session=${githubCookie}; rauth_user=${userCookie}`;

      const githubResult = getSessionFromCookies(githubHeader);
      expect(githubResult?.session.provider).toBe('github');
    });
  });

  describe('Cookie size and performance', () => {
    it('should handle large user metadata', () => {
      const userWithLargeMetadata: User = {
        ...mockUser,
        metadata: {
          preferences: { theme: 'dark', language: 'en', notifications: true },
          history: Array(50).fill({ action: 'view', timestamp: Date.now() }),
          settings: {
            nested: {
              deep: {
                data: 'test'.repeat(100),
              },
            },
          },
        },
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(mockSession));
      const userCookie = encodeURIComponent(JSON.stringify(userWithLargeMetadata));
      const cookieHeader = `rauth_session=${sessionCookie}; rauth_user=${userCookie}`;

      const result = getSessionFromCookies(cookieHeader);
      expect(result).not.toBeNull();
      expect(result?.user.metadata).toEqual(userWithLargeMetadata.metadata);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple simultaneous cookie reads', () => {
      saveSession(mockSession, mockUser);
      const cookieHeader = document.cookie;

      // Simulate concurrent reads
      const results = Array(10).fill(null).map(() => 
        getSessionFromCookies(cookieHeader)
      );

      results.forEach(result => {
        expect(result).not.toBeNull();
        expect(result?.user.email).toBe('integration@test.com');
      });
    });

    it('should handle session updates correctly', () => {
      // Initial session
      saveSession(mockSession, mockUser);

      // Update session
      const updatedSession: Session = {
        ...mockSession,
        accessToken: 'updated_test_token',
        expiresAt: Date.now() + 7200000,
      };

      const updatedUser: User = {
        ...mockUser,
        name: 'Updated Name',
      };

      saveSession(updatedSession, updatedUser);

      // Verify update
      const result = getSession();
      expect(result?.session.accessToken).toBe('updated_test_token');
      expect(result?.user.name).toBe('Updated Name');
    });
  });

  describe('Error recovery', () => {
    it('should recover from malformed cookie data', () => {
      const malformedHeader = 'rauth_session=invalid{json; rauth_user=also}invalid';

      const result = getSessionFromCookies(malformedHeader);
      expect(result).toBeNull();
      // Should not throw error
    });

    it('should handle missing required fields gracefully', () => {
      const incompleteSession = {
        id: 'sess_incomplete',
        // Missing required fields
      };

      const sessionCookie = encodeURIComponent(JSON.stringify(incompleteSession));
      const userCookie = encodeURIComponent(JSON.stringify(mockUser));
      const cookieHeader = `rauth_session=${sessionCookie}; rauth_user=${userCookie}`;

      // Should handle gracefully
      expect(() => getSessionFromCookies(cookieHeader)).not.toThrow();
    });
  });
});
