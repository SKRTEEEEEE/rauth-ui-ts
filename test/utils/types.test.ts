/**
 * Tests for TypeScript types
 * These tests verify that types are properly exported and can be used
 */

import { describe, it, expect } from 'vitest';
import type { User, Session, AuthState, RAuthConfig, Provider } from '../../src/utils/types';

describe('Types', () => {
  it('should have valid User type', () => {
    const user: User = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/pic.jpg',
      provider: 'google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(user.id).toBe('123');
    expect(user.email).toBe('test@example.com');
  });

  it('should have valid Session type', () => {
    const session: Session = {
      id: 'session-123',
      userId: 'user-123',
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    expect(session.id).toBe('session-123');
  });

  it('should have valid AuthState type', () => {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
    };

    expect(authState.isAuthenticated).toBe(false);
  });

  it('should have valid RAuthConfig type', () => {
    const config: RAuthConfig = {
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com',
      providers: ['google', 'github'],
      autoRefresh: true,
    };

    expect(config.apiKey).toBe('test-key');
  });

  it('should have valid Provider type', () => {
    const providers: Provider[] = ['google', 'github', 'facebook'];
    
    expect(providers).toHaveLength(3);
    expect(providers[0]).toBe('google');
  });
});
