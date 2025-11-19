/**
 * Tests for configuration system (config.ts)
 * Note: Test API keys used below are fixtures for testing purposes only
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initRauth, getConfig, isConfigured, resetConfig } from '../../src/utils/config';
import type { RAuthConfig } from '../../src/utils/types';
import { DEFAULT_BASE_URL, DEFAULT_STORAGE_PREFIX, SUPPORTED_PROVIDERS } from '../../src/utils/constants';

describe('Configuration System', () => {
  beforeEach(() => {
    // Reset config before each test
    resetConfig();
    // Clear console mocks
    vi.clearAllMocks();
  });

  describe('initRauth', () => {
    it('should initialize config with required fields', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'github'],
      };

      const result = initRauth(config);

      expect(result).toBeDefined();
      expect(result.apiKey).toBe('pk_test_123456');
      expect(result.providers).toEqual(['google', 'github']);
    });

    it('should apply default baseUrl if not provided', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      const result = initRauth(config);

      expect(result.baseUrl).toBe(DEFAULT_BASE_URL);
    });

    it('should apply default storage config if not provided', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      const result = initRauth(config);

      expect(result.storage).toBeDefined();
      expect(result.storage?.type).toBe('localStorage');
      expect(result.storage?.prefix).toBe(DEFAULT_STORAGE_PREFIX);
    });

    it('should apply default debug mode to false', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      const result = initRauth(config);

      expect(result.debug).toBe(false);
    });

    it('should preserve custom baseUrl if provided', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        baseUrl: 'https://custom.api.com',
      };

      const result = initRauth(config);

      expect(result.baseUrl).toBe('https://custom.api.com');
    });

    it('should preserve custom storage config if provided', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'sessionStorage',
          prefix: 'custom_',
        },
      };

      const result = initRauth(config);

      expect(result.storage?.type).toBe('sessionStorage');
      expect(result.storage?.prefix).toBe('custom_');
    });

    it('should preserve debug mode if provided', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        debug: true,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const result = initRauth(config);

      expect(result.debug).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should throw error if apiKey is missing', () => {
      const config = {
        providers: ['google'],
      } as RAuthConfig;

      expect(() => initRauth(config)).toThrow('apiKey is required');
    });

    it('should throw error if apiKey is empty string', () => {
      const config: RAuthConfig = {
        apiKey: '',
        providers: ['google'],
      };

      expect(() => initRauth(config)).toThrow('apiKey is required');
    });

    it('should throw error if apiKey is whitespace only', () => {
      const config: RAuthConfig = {
        apiKey: '   ',
        providers: ['google'],
      };

      expect(() => initRauth(config)).toThrow('apiKey is required');
    });

    it('should throw error if providers array is empty', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: [],
      };

      expect(() => initRauth(config)).toThrow('At least one provider must be configured');
    });

    it('should throw error if provider is invalid', () => {
      const config = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'invalid_provider'],
      } as unknown as RAuthConfig;

      expect(() => initRauth(config)).toThrow('Invalid provider: invalid_provider');
    });

    it('should accept all valid providers', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: [...SUPPORTED_PROVIDERS] as any,
      };

      const result = initRauth(config);

      expect(result.providers).toEqual(SUPPORTED_PROVIDERS);
    });

    it('should validate baseUrl format (https)', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        baseUrl: 'http://insecure.api.com',
      };

      initRauth(config);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('baseUrl should use HTTPS in production')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should remove trailing slash from baseUrl', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        baseUrl: 'https://api.example.com/',
      };

      const result = initRauth(config);

      expect(result.baseUrl).toBe('https://api.example.com');
    });

    it('should allow multiple calls and log warning', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config1: RAuthConfig = {
        apiKey: 'pk_test_first',
        providers: ['google'],
      };

      const config2: RAuthConfig = {
        apiKey: 'pk_test_second',
        providers: ['github'],
      };

      initRauth(config1);
      initRauth(config2);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('initRauth called multiple times')
      );

      const currentConfig = getConfig();
      expect(currentConfig.apiKey).toBe('pk_test_second');

      consoleWarnSpy.mockRestore();
    });

    it('should log config in debug mode without exposing full apiKey', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const config: RAuthConfig = {
        apiKey: 'pk_test_123456789',
        providers: ['google'],
        debug: true,
      };

      initRauth(config);

      // Check that log was called with config object containing masked apiKey
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall[0]).toContain('[RAuth SDK]');
      expect(logCall[1].apiKey).toMatch(/pk_test.*\*{6}/);

      consoleSpy.mockRestore();
    });
  });

  describe('getConfig', () => {
    it('should return config after initialization', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      initRauth(config);
      const result = getConfig();

      expect(result).toBeDefined();
      expect(result.apiKey).toBe('pk_test_123456');
    });

    it('should throw error if config not initialized', () => {
      expect(() => getConfig()).toThrow(/RAuth SDK Error: SDK not initialized/);
    });

    it('should return the same config object on multiple calls', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      initRauth(config);
      const result1 = getConfig();
      const result2 = getConfig();

      expect(result1).toBe(result2);
    });
  });

  describe('isConfigured', () => {
    it('should return false before initialization', () => {
      expect(isConfigured()).toBe(false);
    });

    it('should return true after initialization', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      initRauth(config);

      expect(isConfigured()).toBe(true);
    });
  });

  describe('resetConfig', () => {
    it('should reset config to uninitialized state', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      initRauth(config);
      expect(isConfigured()).toBe(true);

      resetConfig();
      expect(isConfigured()).toBe(false);
    });

    it('should allow re-initialization after reset', () => {
      const config1: RAuthConfig = {
        apiKey: 'pk_test_first',
        providers: ['google'],
      };

      const config2: RAuthConfig = {
        apiKey: 'pk_test_second',
        providers: ['github'],
      };

      initRauth(config1);
      resetConfig();
      initRauth(config2);

      const result = getConfig();
      expect(result.apiKey).toBe('pk_test_second');
    });
  });

  describe('Edge cases', () => {
    it('should handle providers with undefined (should use default)', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
      };

      // If providers is undefined, it should be allowed (no validation)
      const result = initRauth(config);

      expect(result.providers).toBeUndefined();
    });

    it('should handle partial storage config', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'cookies',
        },
      };

      const result = initRauth(config);

      expect(result.storage?.type).toBe('cookies');
      expect(result.storage?.prefix).toBe(DEFAULT_STORAGE_PREFIX);
    });

    it('should handle all optional redirect URLs', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        redirectUrl: 'https://app.example.com/callback',
        logoutRedirectUrl: 'https://app.example.com/logout',
      };

      const result = initRauth(config);

      expect(result.redirectUrl).toBe('https://app.example.com/callback');
      expect(result.logoutRedirectUrl).toBe('https://app.example.com/logout');
    });

    it('should handle cookie options in storage config', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        storage: {
          type: 'cookies',
          prefix: 'app_',
          cookieOptions: {
            domain: '.example.com',
            path: '/',
            secure: true,
            sameSite: 'strict',
            maxAge: 86400,
          },
        },
      };

      const result = initRauth(config);

      expect(result.storage?.cookieOptions).toBeDefined();
      expect(result.storage?.cookieOptions?.domain).toBe('.example.com');
      expect(result.storage?.cookieOptions?.secure).toBe(true);
      expect(result.storage?.cookieOptions?.sameSite).toBe('strict');
    });
  });
});
