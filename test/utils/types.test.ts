/**
 * Tests for TypeScript types and interfaces
 * These tests verify type safety and compile-time correctness
 */

import { describe, it, expect } from 'vitest';
import type {
  ProviderName,
  User,
  Session,
  Provider,
  RAuthConfig,
  StorageConfig,
  CookieOptions,
  AuthState,
  LoginResponse,
  RefreshResponse,
  ApiError,
  AuthComponentProps,
  UseSessionOptions,
} from '../../src/utils/types';

describe('TypeScript Types', () => {
  describe('ProviderName', () => {
    it('should accept valid provider names', () => {
      const providers: ProviderName[] = [
        'google',
        'github',
        'facebook',
        'twitter',
        'linkedin',
      ];
      expect(providers).toHaveLength(5);
    });

    it('should be type-safe at compile time', () => {
      // This test validates that only valid providers are accepted
      const validProvider: ProviderName = 'google';
      expect(validProvider).toBe('google');
    });
  });

  describe('User', () => {
    it('should have all required fields', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.emailVerified).toBe(true);
    });

    it('should allow optional fields to be undefined', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(user.name).toBeUndefined();
      expect(user.avatar).toBeUndefined();
      expect(user.metadata).toBeUndefined();
    });

    it('should accept metadata as Record<string, unknown>', () => {
      const user: User = {
        id: 'user-123',
        email: 'test@example.com',
        emailVerified: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        metadata: {
          customField: 'value',
          nestedObject: { key: 'value' },
          arrayField: [1, 2, 3],
        },
      };

      expect(user.metadata).toBeDefined();
      expect(user.metadata?.customField).toBe('value');
    });
  });

  describe('Session', () => {
    it('should have all required fields', () => {
      const session: Session = {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'test_access_jwt',
        refreshToken: 'test_refresh_jwt',
        expiresAt: Date.now() + 3600000,
        createdAt: '2024-01-01T00:00:00Z',
        provider: 'google',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      expect(session.id).toBe('session-123');
      expect(session.userId).toBe('user-123');
      expect(typeof session.expiresAt).toBe('number');
    });

    it('should allow optional fields to be undefined', () => {
      const session: Session = {
        id: 'session-123',
        userId: 'user-123',
        accessToken: 'test_access_jwt',
        refreshToken: 'test_refresh_jwt',
        expiresAt: Date.now() + 3600000,
        createdAt: '2024-01-01T00:00:00Z',
        provider: 'google',
      };

      expect(session.ipAddress).toBeUndefined();
      expect(session.userAgent).toBeUndefined();
    });
  });

  describe('Provider', () => {
    it('should have all required fields', () => {
      const provider: Provider = {
        name: 'google',
        enabled: true,
        clientId: 'test_oauth_client_id',
        scopes: ['email', 'profile'],
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        callbackUrl: 'https://example.com/callback',
      };

      expect(provider.name).toBe('google');
      expect(provider.enabled).toBe(true);
      expect(provider.scopes).toHaveLength(2);
    });
  });

  describe('RAuthConfig', () => {
    it('should have required fields', () => {
      const config: RAuthConfig = {
        apiKey: 'test_api_key_placeholder',
        baseUrl: 'https://api.rauth.dev',
        providers: ['google', 'github'],
      };

      expect(config.apiKey).toBe('test_api_key_placeholder');
      expect(config.providers).toHaveLength(2);
    });

    it('should allow optional fields', () => {
      const config: RAuthConfig = {
        apiKey: 'test_placeholder_key',
        baseUrl: 'https://api.rauth.dev',
        providers: ['google'],
        redirectUrl: 'https://example.com/auth',
        logoutRedirectUrl: 'https://example.com/logout',
        storage: {
          type: 'localStorage',
          prefix: 'rauth_',
        },
        debug: true,
      };

      expect(config.storage?.type).toBe('localStorage');
      expect(config.debug).toBe(true);
    });
  });

  describe('StorageConfig', () => {
    it('should accept localStorage type', () => {
      const storage: StorageConfig = {
        type: 'localStorage',
        prefix: 'rauth_',
      };

      expect(storage.type).toBe('localStorage');
    });

    it('should accept sessionStorage type', () => {
      const storage: StorageConfig = {
        type: 'sessionStorage',
        prefix: 'rauth_',
      };

      expect(storage.type).toBe('sessionStorage');
    });

    it('should accept cookies type with options', () => {
      const storage: StorageConfig = {
        type: 'cookies',
        prefix: 'rauth_',
        cookieOptions: {
          domain: '.example.com',
          path: '/',
          secure: true,
          sameSite: 'lax',
          maxAge: 3600,
        },
      };

      expect(storage.cookieOptions?.secure).toBe(true);
    });
  });

  describe('CookieOptions', () => {
    it('should allow all cookie options', () => {
      const options: CookieOptions = {
        domain: '.example.com',
        path: '/',
        secure: true,
        sameSite: 'strict',
        maxAge: 7200,
      };

      expect(options.sameSite).toBe('strict');
      expect(options.maxAge).toBe(7200);
    });

    it('should allow partial options', () => {
      const options: CookieOptions = {
        secure: true,
        sameSite: 'lax',
      };

      expect(options.domain).toBeUndefined();
      expect(options.path).toBeUndefined();
    });
  });

  describe('AuthState', () => {
    it('should represent authenticated state', () => {
      const state: AuthState = {
        isAuthenticated: true,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          accessToken: 'mock_jwt_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: Date.now() + 3600000,
          createdAt: '2024-01-01T00:00:00Z',
          provider: 'google',
        },
        loading: false,
      };

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toBeDefined();
      expect(state.session).toBeDefined();
    });

    it('should represent unauthenticated state', () => {
      const state: AuthState = {
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
      };

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
    });

    it('should allow error state', () => {
      const state: AuthState = {
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
        error: 'Authentication failed',
      };

      expect(state.error).toBe('Authentication failed');
    });
  });

  describe('LoginResponse', () => {
    it('should have all required fields', () => {
      const response: LoginResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          emailVerified: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        session: {
          id: 'session-123',
          userId: 'user-123',
          accessToken: 'mock_access',
          refreshToken: 'mock_refresh',
          expiresAt: Date.now() + 3600000,
          createdAt: '2024-01-01T00:00:00Z',
          provider: 'google',
        },
        accessToken: 'mock_access',
        refreshToken: 'mock_refresh',
        expiresAt: Date.now() + 3600000,
      };

      expect(response.user).toBeDefined();
      expect(response.session).toBeDefined();
      expect(response.accessToken).toBe('mock_access');
    });
  });

  describe('RefreshResponse', () => {
    it('should have all required fields', () => {
      const response: RefreshResponse = {
        accessToken: 'mock_new_access',
        refreshToken: 'mock_new_refresh',
        expiresAt: Date.now() + 3600000,
      };

      expect(response.accessToken).toBe('mock_new_access');
      expect(typeof response.expiresAt).toBe('number');
    });
  });

  describe('ApiError', () => {
    it('should have all required fields', () => {
      const error: ApiError = {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
        status: 401,
      };

      expect(error.message).toBe('Authentication failed');
      expect(error.status).toBe(401);
    });

    it('should allow optional details', () => {
      const error: ApiError = {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: {
          field: 'email',
          reason: 'Invalid format',
        },
      };

      expect(error.details).toBeDefined();
      expect(error.details?.field).toBe('email');
    });
  });

  describe('AuthComponentProps', () => {
    it('should accept minimal props', () => {
      const props: AuthComponentProps = {
        provider: 'google',
      };

      expect(props.provider).toBe('google');
    });

    it('should accept all optional props', () => {
      const props: AuthComponentProps = {
        provider: 'github',
        className: 'custom-class',
        showAvatar: true,
        loginButtonText: 'Sign in with GitHub',
        logoutButtonText: 'Sign out',
        onLoginSuccess: (user) => console.log(user),
        onLogout: () => console.log('logged out'),
        onError: (error) => console.error(error),
      };

      expect(props.className).toBe('custom-class');
      expect(props.showAvatar).toBe(true);
      expect(props.loginButtonText).toBe('Sign in with GitHub');
    });
  });

  describe('UseSessionOptions', () => {
    it('should accept minimal options', () => {
      const options: UseSessionOptions = {};

      expect(options.autoRefresh).toBeUndefined();
    });

    it('should accept all options', () => {
      const options: UseSessionOptions = {
        autoRefresh: true,
        refreshThreshold: 300000,
        onRefreshSuccess: (tokens) => console.log(tokens),
        onRefreshError: (error) => console.error(error),
        onSessionExpired: () => console.log('expired'),
      };

      expect(options.autoRefresh).toBe(true);
      expect(options.refreshThreshold).toBe(300000);
    });
  });
});
