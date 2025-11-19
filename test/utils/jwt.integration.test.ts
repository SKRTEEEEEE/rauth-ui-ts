/**
 * Integration tests for JWT utilities
 * Tests interaction with other components and real-world scenarios
 */

import { describe, it, expect, vi } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiration, getTokenSubject, getTokenClaim } from '../../src/utils/jwt';

describe('JWT utilities - Integration Tests', () => {
  // Helper to create base64url encoded string (SSR-safe)
  const base64UrlEncode = (str: string): string => {
    const base64 = Buffer.from(str).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  // Create a realistic JWT token similar to what backend would send
  const createRealisticToken = (overrides?: Partial<{
    sub: string;
    exp: number;
    iat: number;
    email: string;
    name: string;
    provider: string;
  }>): string => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'google-oauth2|123456789',
      exp: now + 3600, // 1 hour from now
      iat: now,
      email: 'user@example.com',
      name: 'Test User',
      provider: 'google',
      ...overrides,
    };
    
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = 'realistic-mock-signature-from-backend';
    
    return `${header}.${encodedPayload}.${signature}`;
  };

  describe('Real-world token scenarios', () => {
    it('should handle a realistic OAuth token from Google', () => {
      const token = createRealisticToken({
        sub: 'google-oauth2|987654321',
        email: 'john.doe@gmail.com',
        name: 'John Doe',
        provider: 'google',
      });

      const decoded = decodeJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('google-oauth2|987654321');
      expect(decoded?.email).toBe('john.doe@gmail.com');
      expect(decoded?.provider).toBe('google');
    });

    it('should handle a realistic OAuth token from GitHub', () => {
      const token = createRealisticToken({
        sub: 'github|123456',
        email: 'developer@github.com',
        name: 'GitHub User',
        provider: 'github',
      });

      const decoded = decodeJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('github|123456');
      expect(decoded?.provider).toBe('github');
    });

    it('should handle session refresh scenario', () => {
      // Simulate a token that's about to expire
      const almostExpiredToken = createRealisticToken({
        exp: Math.floor(Date.now() / 1000) + 45, // 45 seconds from now
      });

      // Should be considered expired due to 60s buffer
      expect(isTokenExpired(almostExpiredToken)).toBe(true);

      // Create a fresh token
      const freshToken = createRealisticToken({
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      });

      expect(isTokenExpired(freshToken)).toBe(false);
    });

    it('should handle token with all standard JWT claims', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: 'user-123',
        exp: now + 3600,
        iat: now,
        nbf: now, // Not before
        aud: 'rauth-client',
        iss: 'https://api.rauth.dev',
        jti: 'token-id-12345',
      };

      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = base64UrlEncode(JSON.stringify(payload));
      const token = `${header}.${encodedPayload}.signature`;

      const decoded = decodeJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.aud).toBe('rauth-client');
      expect(decoded?.iss).toBe('https://api.rauth.dev');
      expect(decoded?.jti).toBe('token-id-12345');
      expect(decoded?.nbf).toBe(now);
    });

    it('should extract user info from token for UI display', () => {
      const token = createRealisticToken({
        sub: 'auth0|user-123',
        email: 'display.user@example.com',
        name: 'Display User',
        provider: 'google',
      });

      const decoded = decodeJWT(token);
      const userId = getTokenSubject(token);
      const expiration = getTokenExpiration(token);

      // Verify we can extract all needed info for UI
      expect(userId).toBe('auth0|user-123');
      expect(decoded?.email).toBe('display.user@example.com');
      expect(decoded?.name).toBe('Display User');
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle token lifecycle: creation, validation, expiration', () => {
      // 1. Fresh token
      const freshToken = createRealisticToken({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      expect(isTokenExpired(freshToken)).toBe(false);

      // 2. Token about to expire (within buffer)
      const expiringSoonToken = createRealisticToken({
        exp: Math.floor(Date.now() / 1000) + 30,
      });
      expect(isTokenExpired(expiringSoonToken)).toBe(true); // Should trigger refresh

      // 3. Expired token
      const expiredToken = createRealisticToken({
        exp: Math.floor(Date.now() / 1000) - 3600,
      });
      expect(isTokenExpired(expiredToken)).toBe(true);
    });
  });

  describe('Error recovery and fallback scenarios', () => {
    it('should safely handle corrupted tokens in production', () => {
      const corruptedTokens = [
        'corrupted.token.here',
        'only-two-parts.here',
        '',
        'one',
        'too.many.parts.in.this.token',
      ];

      corruptedTokens.forEach(token => {
        // Should not throw, just return safe defaults
        expect(() => decodeJWT(token)).not.toThrow();
        expect(() => isTokenExpired(token)).not.toThrow();
        expect(() => getTokenExpiration(token)).not.toThrow();
        expect(() => getTokenSubject(token)).not.toThrow();

        // Should return safe defaults
        expect(decodeJWT(token)).toBeNull();
        expect(isTokenExpired(token)).toBe(true); // Safe default: treat as expired
        expect(getTokenExpiration(token)).toBeNull();
        expect(getTokenSubject(token)).toBeNull();
      });
    });

    it('should handle tokens with missing required claims gracefully', () => {
      // Token with missing exp
      const noExpToken = (() => {
        const payload = { sub: 'user-123', iat: Math.floor(Date.now() / 1000) };
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));
        return `${header}.${encodedPayload}.signature`;
      })();

      expect(isTokenExpired(noExpToken)).toBe(true); // Treat as expired
      expect(getTokenExpiration(noExpToken)).toBeNull();

      // Token with missing sub
      const noSubToken = (() => {
        const payload = { exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) };
        const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));
        return `${header}.${encodedPayload}.signature`;
      })();

      expect(getTokenSubject(noSubToken)).toBeNull();
    });

    it('should handle network response with malformed token', () => {
      // Simulate what might come from a buggy API response
      const malformedResponses = [
        null as any,
        undefined as any,
        123 as any,
        { token: 'value' } as any,
        ['array'] as any,
      ];

      malformedResponses.forEach(response => {
        // Type coercion to string might happen in real code
        const tokenStr = String(response);
        
        expect(() => decodeJWT(tokenStr)).not.toThrow();
        expect(decodeJWT(tokenStr)).toBeNull();
        expect(isTokenExpired(tokenStr)).toBe(true);
      });
    });
  });

  describe('SSR and environment compatibility', () => {
    it('should work in Node.js environment (SSR)', () => {
      // This test itself runs in Node (via Vitest)
      // Verify that base64url decoding works without browser APIs
      const token = createRealisticToken();
      
      const decoded = decodeJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBeDefined();
    });

    it('should handle tokens generated with different base64 encodings', () => {
      // Sometimes backends might send standard base64 instead of base64url
      // Our implementation should handle base64url properly
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      // Create with base64url (correct)
      const token = createRealisticToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('user-123');
    });
  });

  describe('Token extraction for API calls', () => {
    it('should extract info needed for authenticated API requests', () => {
      const token = createRealisticToken({
        sub: 'user-api-123',
        email: 'api.user@example.com',
      });

      // Verify we can check if token is valid before making API call
      expect(isTokenExpired(token)).toBe(false);

      // Verify we can extract user ID for API requests
      const userId = getTokenSubject(token);
      expect(userId).toBe('user-api-123');

      // Verify we can check expiration to decide on refresh
      const expiration = getTokenExpiration(token);
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should help determine when to refresh token proactively', () => {
      const now = Math.floor(Date.now() / 1000);
      
      // Token expiring in 90 seconds
      const token90s = createRealisticToken({ exp: now + 90 });
      expect(isTokenExpired(token90s)).toBe(false); // Still valid (> 60s buffer)

      // Token expiring in 45 seconds
      const token45s = createRealisticToken({ exp: now + 45 });
      expect(isTokenExpired(token45s)).toBe(true); // Should refresh (< 60s buffer)

      // Token expiring in 30 seconds
      const token30s = createRealisticToken({ exp: now + 30 });
      expect(isTokenExpired(token30s)).toBe(true); // Should refresh
    });
  });

  describe('Multi-provider token handling', () => {
    const providers = [
      { name: 'google', subFormat: 'google-oauth2|123456789' },
      { name: 'github', subFormat: 'github|987654321' },
      { name: 'facebook', subFormat: 'facebook|555555555' },
      { name: 'twitter', subFormat: 'twitter|111111111' },
    ];

    providers.forEach(({ name, subFormat }) => {
      it(`should handle ${name} OAuth tokens`, () => {
        const token = createRealisticToken({
          sub: subFormat,
          provider: name,
          email: `user@${name}.com`,
        });

        const decoded = decodeJWT(token);
        const subject = getTokenSubject(token);

        expect(decoded).not.toBeNull();
        expect(decoded?.provider).toBe(name);
        expect(subject).toBe(subFormat);
        expect(isTokenExpired(token)).toBe(false);
      });
    });
  });

  describe('Performance with large tokens', () => {
    it('should efficiently decode tokens with large custom claims', () => {
      const largePermissions = Array.from({ length: 100 }, (_, i) => `permission-${i}`);
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        permissions: largePermissions,
        metadata: {
          nested: {
            data: {
              deep: 'value',
            },
          },
        },
      };

      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const encodedPayload = base64UrlEncode(JSON.stringify(payload));
      const token = `${header}.${encodedPayload}.signature`;

      const startTime = performance.now();
      const decoded = decodeJWT(token);
      const endTime = performance.now();

      expect(decoded).not.toBeNull();
      expect(decoded?.permissions).toHaveLength(100);
      expect(decoded?.metadata?.nested?.data?.deep).toBe('value');
      
      // Should decode in less than 10ms even with large payload
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should handle rapid successive token operations', () => {
      const tokens = Array.from({ length: 100 }, (_, i) => 
        createRealisticToken({ sub: `user-${i}` })
      );

      const startTime = performance.now();
      
      tokens.forEach(token => {
        decodeJWT(token);
        isTokenExpired(token);
        getTokenExpiration(token);
        getTokenSubject(token);
      });

      const endTime = performance.now();
      
      // 100 tokens × 4 operations each should complete in < 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
