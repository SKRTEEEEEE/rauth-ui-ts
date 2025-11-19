/**
 * Tests for SDK constants
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BASE_URL,
  SUPPORTED_PROVIDERS,
  DEFAULT_REFRESH_THRESHOLD,
  DEFAULT_STORAGE_PREFIX,
  STORAGE_KEYS,
  API_ENDPOINTS,
} from '../../src/utils/constants';

describe('Constants', () => {
  describe('DEFAULT_BASE_URL', () => {
    it('should be a valid URL string', () => {
      expect(typeof DEFAULT_BASE_URL).toBe('string');
      expect(DEFAULT_BASE_URL).toMatch(/^https?:\/\/.+/);
    });
  });

  describe('SUPPORTED_PROVIDERS', () => {
    it('should contain all supported providers', () => {
      expect(SUPPORTED_PROVIDERS).toContain('google');
      expect(SUPPORTED_PROVIDERS).toContain('github');
      expect(SUPPORTED_PROVIDERS).toContain('facebook');
      expect(SUPPORTED_PROVIDERS).toContain('twitter');
      expect(SUPPORTED_PROVIDERS).toContain('linkedin');
    });

    it('should have at least 5 providers', () => {
      expect(SUPPORTED_PROVIDERS.length).toBeGreaterThanOrEqual(5);
    });

    it('should be a readonly array', () => {
      expect(Array.isArray(SUPPORTED_PROVIDERS)).toBe(true);
    });
  });

  describe('DEFAULT_REFRESH_THRESHOLD', () => {
    it('should be a positive number', () => {
      expect(typeof DEFAULT_REFRESH_THRESHOLD).toBe('number');
      expect(DEFAULT_REFRESH_THRESHOLD).toBeGreaterThan(0);
    });

    it('should be 5 minutes (300000 ms)', () => {
      expect(DEFAULT_REFRESH_THRESHOLD).toBe(300000);
    });
  });

  describe('DEFAULT_STORAGE_PREFIX', () => {
    it('should be a string', () => {
      expect(typeof DEFAULT_STORAGE_PREFIX).toBe('string');
    });

    it('should be "rauth_"', () => {
      expect(DEFAULT_STORAGE_PREFIX).toBe('rauth_');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('should have access_token key', () => {
      expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('rauth_access_jwt');
    });

    it('should have refresh_token key', () => {
      expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('rauth_refresh_jwt');
    });

    it('should have user key', () => {
      expect(STORAGE_KEYS.USER).toBe('rauth_user_data');
    });

    it('should have session key', () => {
      expect(STORAGE_KEYS.SESSION).toBe('rauth_session_data');
    });

    it('should have expires_at key', () => {
      expect(STORAGE_KEYS.EXPIRES_AT).toBe('rauth_jwt_expires_at');
    });

    it('should have all required keys', () => {
      const requiredKeys = [
        'ACCESS_TOKEN',
        'REFRESH_TOKEN',
        'USER',
        'SESSION',
        'EXPIRES_AT',
      ];

      requiredKeys.forEach((key) => {
        expect(STORAGE_KEYS).toHaveProperty(key);
      });
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have oauth authorize endpoint', () => {
      expect(API_ENDPOINTS.OAUTH_AUTHORIZE).toBe('/api/v1/oauth/authorize');
    });

    it('should have oauth callback endpoint', () => {
      expect(API_ENDPOINTS.OAUTH_CALLBACK).toBe('/api/v1/oauth/callback');
    });

    it('should have session refresh endpoint', () => {
      expect(API_ENDPOINTS.SESSION_REFRESH).toBe('/api/v1/sessions/refresh');
    });

    it('should have session delete endpoint', () => {
      expect(API_ENDPOINTS.SESSION_DELETE).toMatch(/^\/api\/v1\/sessions\//);
    });

    it('should have user me endpoint', () => {
      expect(API_ENDPOINTS.USER_ME).toBe('/api/v1/users/me');
    });

    it('should have all required endpoints', () => {
      const requiredEndpoints = [
        'OAUTH_AUTHORIZE',
        'OAUTH_CALLBACK',
        'SESSION_REFRESH',
        'SESSION_DELETE',
        'USER_ME',
      ];

      requiredEndpoints.forEach((endpoint) => {
        expect(API_ENDPOINTS).toHaveProperty(endpoint);
      });
    });

    it('should have endpoints starting with /api/v1/', () => {
      Object.values(API_ENDPOINTS).forEach((endpoint) => {
        expect(endpoint).toMatch(/^\/api\/v1\//);
      });
    });
  });
});
