/**
 * Tests for server middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage
vi.mock('../../src/utils/storage', () => ({
  getSessionFromCookies: vi.fn()
}));

import { 
  authMiddleware, 
  isAuthenticated, 
  createAuthMiddleware,
  isPathMatch,
  matchesAnyPattern
} from '../../src/server/middleware';
import { getSessionFromCookies } from '../../src/utils/storage';

describe('Server middleware - Basic exports', () => {
  it('should export createAuthMiddleware', () => {
    expect(typeof createAuthMiddleware).toBe('function');
  });

  it('should export authMiddleware', () => {
    expect(typeof authMiddleware).toBe('function');
  });

  it('should export isAuthenticated', () => {
    expect(typeof isAuthenticated).toBe('function');
  });

  it('should export isPathMatch', () => {
    expect(typeof isPathMatch).toBe('function');
  });

  it('should export matchesAnyPattern', () => {
    expect(typeof matchesAnyPattern).toBe('function');
  });
});

describe('isPathMatch utility', () => {
  it('should match exact paths', () => {
    expect(isPathMatch('/dashboard', '/dashboard')).toBe(true);
    expect(isPathMatch('/profile', '/profile')).toBe(true);
    expect(isPathMatch('/', '/')).toBe(true);
  });

  it('should not match different paths', () => {
    expect(isPathMatch('/dashboard', '/profile')).toBe(false);
    expect(isPathMatch('/about', '/contact')).toBe(false);
  });

  it('should normalize trailing slashes', () => {
    expect(isPathMatch('/dashboard/', '/dashboard')).toBe(true);
    expect(isPathMatch('/dashboard', '/dashboard/')).toBe(true);
    expect(isPathMatch('/dashboard/', '/dashboard/')).toBe(true);
  });

  it('should match wildcard paths', () => {
    expect(isPathMatch('/dashboard/settings', '/dashboard/*')).toBe(true);
    expect(isPathMatch('/dashboard/profile', '/dashboard/*')).toBe(true);
    expect(isPathMatch('/api/users', '/api/*')).toBe(true);
  });

  it('should match nested wildcard paths', () => {
    expect(isPathMatch('/dashboard/settings/profile', '/dashboard/*')).toBe(true);
    expect(isPathMatch('/api/v1/users', '/api/*')).toBe(true);
  });

  it('should not match partial paths without wildcard', () => {
    expect(isPathMatch('/dashboard/settings', '/dashboard')).toBe(false);
    expect(isPathMatch('/api/users', '/api')).toBe(false);
  });

  it('should match base path with wildcard', () => {
    expect(isPathMatch('/dashboard', '/dashboard/*')).toBe(true);
  });
});

describe('matchesAnyPattern utility', () => {
  it('should match if any pattern matches', () => {
    expect(matchesAnyPattern('/dashboard', ['/dashboard', '/profile'])).toBe(true);
    expect(matchesAnyPattern('/profile', ['/dashboard', '/profile'])).toBe(true);
  });

  it('should return false if no patterns match', () => {
    expect(matchesAnyPattern('/about', ['/dashboard', '/profile'])).toBe(false);
  });

  it('should work with wildcard patterns', () => {
    expect(matchesAnyPattern('/dashboard/settings', ['/dashboard/*', '/profile'])).toBe(true);
    expect(matchesAnyPattern('/api/users', ['/dashboard/*', '/api/*'])).toBe(true);
  });

  it('should handle empty array', () => {
    expect(matchesAnyPattern('/dashboard', [])).toBe(false);
  });
});

describe('isAuthenticated function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when no session', async () => {
    vi.mocked(getSessionFromCookies).mockReturnValue(null);
    
    const mockRequest = {
      cookies: {
        getAll: () => []
      }
    } as any;

    const result = await isAuthenticated(mockRequest);
    expect(result).toBe(false);
  });

  it('should return false when session is expired', async () => {
    vi.mocked(getSessionFromCookies).mockReturnValue({
      session: {
        id: '123',
        userId: 'user-123',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() - 10000, // Expired
        createdAt: new Date().toISOString(),
        provider: 'google'
      },
      user: null
    });
    
    const mockRequest = {
      cookies: {
        getAll: () => [{ name: 'rauth_session', value: 'abc123' }]
      }
    } as any;

    const result = await isAuthenticated(mockRequest);
    expect(result).toBe(false);
  });

  it('should return true for valid session', async () => {
    vi.mocked(getSessionFromCookies).mockReturnValue({
      session: {
        id: '123',
        userId: 'user-123',
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000, // Valid for 1 hour
        createdAt: new Date().toISOString(),
        provider: 'google'
      },
      user: null
    });
    
    const mockRequest = {
      cookies: {
        getAll: () => [{ name: 'rauth_session', value: 'abc123' }]
      }
    } as any;

    const result = await isAuthenticated(mockRequest);
    expect(result).toBe(true);
  });

  it('should return false on error', async () => {
    vi.mocked(getSessionFromCookies).mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    const mockRequest = {
      cookies: {
        getAll: () => []
      }
    } as any;

    const result = await isAuthenticated(mockRequest);
    expect(result).toBe(false);
  });
});
