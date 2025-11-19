/**
 * Tests for JWT utilities
 */

import { describe, it, expect } from 'vitest';
import { decodeJWT, isTokenExpired, getTokenExpiration, getTokenSubject } from '../../src/utils/jwt';

describe('JWT utilities', () => {
  // Create a mock JWT token (header.payload.signature)
  const createMockToken = (payload: object): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${encodedPayload}.${signature}`;
  };

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
  });

  it('should return null for invalid JWT token', () => {
    const decoded = decodeJWT('invalid-token');
    expect(decoded).toBeNull();
  });

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

  it('should return null for missing expiration', () => {
    const payload = { sub: 'user-123' };
    const token = createMockToken(payload);
    const expiration = getTokenExpiration(token);

    expect(expiration).toBeNull();
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
});
