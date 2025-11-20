/**
 * Tests for JWT utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiration, getTokenSubject, getTokenClaim, type JWTPayload } from '../../src/utils/jwt';

describe('JWT utilities - Unit Tests', () => {
  // Helper to create base64url encoded string (SSR-safe)
  const base64UrlEncode = (str: string): string => {
    const base64 = Buffer.from(str).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  // Create a mock JWT token (header.payload.signature) using base64url encoding
  const createMockToken = (payload: object): string => {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const sig = 'test-sig-value'; // Mock signature part
    return `${header}.${encodedPayload}.${sig}`;
  };

  describe('decodeJWT', () => {
    it('should decode a valid JWT token', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('user-123');
      expect(decoded?.exp).toBe(payload.exp);
      expect(decoded?.iat).toBe(payload.iat);
    });

    it('should decode JWT with base64url encoding (with - and _)', () => {
      // Create a payload that will result in base64url special chars
      const payload = {
        sub: 'user-123-test',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        data: 'test???data>>>with///special+++chars',
      };
      const token = createMockToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('user-123-test');
      expect(decoded?.data).toBe('test???data>>>with///special+++chars');
    });

    it('should decode JWT with custom claims', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        role: 'admin',
        permissions: ['read', 'write'],
      };
      const token = createMockToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('admin');
      expect(decoded?.permissions).toEqual(['read', 'write']);
    });

    it('should return null for invalid JWT token (not 3 parts)', () => {
      const decoded = decodeJWT('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for JWT with only 2 parts', () => {
      const decoded = decodeJWT('header.payload');
      expect(decoded).toBeNull();
    });

    it('should return null for JWT with 4 parts', () => {
      const decoded = decodeJWT('header.payload.signature.extra');
      expect(decoded).toBeNull();
    });

    it('should return null for empty string', () => {
      const decoded = decodeJWT('');
      expect(decoded).toBeNull();
    });

    it('should return null for malformed base64 payload', () => {
      const token = 'header.not-valid-base64!@#$.signature';
      const decoded = decodeJWT(token);
      expect(decoded).toBeNull();
    });

    it('should return null for non-JSON payload', () => {
      const invalidPayload = base64UrlEncode('this is not JSON');
      const token = `header.${invalidPayload}.signature`;
      const decoded = decodeJWT(token);
      expect(decoded).toBeNull();
    });

    it('should handle tokens without padding', () => {
      // Base64url tokens typically don't have padding
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      // Verify no padding in token
      expect(token).not.toContain('=');
      
      const decoded = decodeJWT(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe('user-123');
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired tokens', () => {
      const expiredPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200,
      };
      const token = createMockToken(expiredPayload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should detect valid tokens', () => {
      const validPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(validPayload);
      
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should consider token expired if expires within 60 seconds (buffer)', () => {
      const soonToExpirePayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 30, // 30 seconds from now
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(soonToExpirePayload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should not consider token expired if expires after 60 seconds buffer', () => {
      const validPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 120, // 2 minutes from now
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(validPayload);
      
      expect(isTokenExpired(token)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      const payload = { sub: 'user-123', iat: Math.floor(Date.now() / 1000) };
      const token = createMockToken(payload);
      
      expect(isTokenExpired(token)).toBe(true);
    });

    it('should return true for empty string token', () => {
      expect(isTokenExpired('')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should get token expiration date', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = {
        sub: 'user-123',
        exp: futureTime,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const expiration = getTokenExpiration(token);

      expect(expiration).not.toBeNull();
      expect(expiration?.getTime()).toBe(futureTime * 1000);
    });

    it('should return null for missing expiration', () => {
      const payload = { sub: 'user-123' };
      const token = createMockToken(payload);
      const expiration = getTokenExpiration(token);

      expect(expiration).toBeNull();
    });

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid-token');
      expect(expiration).toBeNull();
    });

    it('should correctly convert Unix timestamp to JavaScript Date', () => {
      const unixTimestamp = 1700000000; // Specific Unix timestamp
      const payload = {
        sub: 'user-123',
        exp: unixTimestamp,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const expiration = getTokenExpiration(token);

      expect(expiration).not.toBeNull();
      expect(expiration?.getTime()).toBe(unixTimestamp * 1000);
      expect(expiration).toBeInstanceOf(Date);
    });
  });

  describe('getTokenSubject', () => {
    it('should get token subject', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const subject = getTokenSubject(token);

      expect(subject).toBe('user-123');
    });

    it('should return null for missing subject', () => {
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const subject = getTokenSubject(token);

      expect(subject).toBeNull();
    });

    it('should return null for invalid token', () => {
      const subject = getTokenSubject('invalid-token');
      expect(subject).toBeNull();
    });

    it('should handle various subject formats', () => {
      const subjects = [
        'user-123',
        'auth0|user-456',
        'google-oauth2|789',
        'uuid-format-example-test-value123456', // UUID-like format
      ];

      subjects.forEach(sub => {
        const payload = {
          sub,
          exp: Math.floor(Date.now() / 1000) + 3600,
          iat: Math.floor(Date.now() / 1000),
        };
        const token = createMockToken(payload);
        const subject = getTokenSubject(token);

        expect(subject).toBe(sub);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle tokens with null payload', () => {
      const token = 'header..signature';
      const decoded = decodeJWT(token);
      expect(decoded).toBeNull();
    });

    it('should handle very large payloads', () => {
      const largeData = 'x'.repeat(10000);
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        data: largeData,
      };
      const token = createMockToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.data).toBe(largeData);
    });

    it('should handle tokens with special characters in claims', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test+special@example.com',
        name: 'John O\'Brien',
        description: 'Test "quotes" and \n newlines',
      };
      const token = createMockToken(payload);
      const decoded = decodeJWT(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.email).toBe('test+special@example.com');
      expect(decoded?.name).toBe('John O\'Brien');
    });

    it('should handle tokens with numeric string subjects', () => {
      const payload = {
        sub: '12345',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      const subject = getTokenSubject(token);

      expect(subject).toBe('12345');
      expect(typeof subject).toBe('string');
    });
  });

  describe('getTokenClaim', () => {
    it('should get a specific claim from token', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        email: 'test@example.com',
        role: 'admin',
      };
      const token = createMockToken(payload);
      
      const email = getTokenClaim<string>(token, 'email');
      const role = getTokenClaim<string>(token, 'role');

      expect(email).toBe('test@example.com');
      expect(role).toBe('admin');
    });

    it('should return null for non-existent claim', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const token = createMockToken(payload);
      
      const nonExistent = getTokenClaim(token, 'nonExistentClaim');
      expect(nonExistent).toBeNull();
    });

    it('should return null for invalid token', () => {
      const claim = getTokenClaim('invalid-token', 'email');
      expect(claim).toBeNull();
    });

    it('should handle complex claim types', () => {
      const payload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        permissions: ['read', 'write', 'delete'],
        metadata: { nested: { value: 'test' } },
      };
      const token = createMockToken(payload);
      
      const permissions = getTokenClaim<string[]>(token, 'permissions');
      const metadata = getTokenClaim<{ nested: { value: string } }>(token, 'metadata');

      expect(permissions).toEqual(['read', 'write', 'delete']);
      expect(metadata).toEqual({ nested: { value: 'test' } });
    });

    it('should handle standard JWT claims', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        sub: 'user-123',
        exp: now + 3600,
        iat: now,
        nbf: now,
        aud: 'rauth-client',
        iss: 'https://api.rauth.dev',
      };
      const token = createMockToken(payload);
      
      expect(getTokenClaim<number>(token, 'exp')).toBe(now + 3600);
      expect(getTokenClaim<number>(token, 'iat')).toBe(now);
      expect(getTokenClaim<number>(token, 'nbf')).toBe(now);
      expect(getTokenClaim<string>(token, 'aud')).toBe('rauth-client');
      expect(getTokenClaim<string>(token, 'iss')).toBe('https://api.rauth.dev');
    });
  });
});
