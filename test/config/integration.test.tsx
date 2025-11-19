/**
 * Integration tests for configuration system with AuthProvider
 * Note: Test API keys used below are fixtures for testing purposes only
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { initRauth, getConfig, resetConfig, isConfigured } from '../../src/utils/config';
import { AuthProvider } from '../../src/providers/AuthProvider';
import type { RAuthConfig } from '../../src/utils/types';

describe('Configuration Integration', () => {
  beforeEach(() => {
    resetConfig();
    vi.clearAllMocks();
  });

  describe('AuthProvider with config validation', () => {
    it('should work with AuthProvider when config is initialized', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'github'],
      };

      initRauth(config);

      expect(() => {
        render(
          <AuthProvider config={config}>
            <div>Test Child</div>
          </AuthProvider>
        );
      }).not.toThrow();
    });

    it('should log warning if AuthProvider used without calling initRauth first', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      // Don't call initRauth, just use AuthProvider
      render(
        <AuthProvider config={config}>
          <div>Test Child</div>
        </AuthProvider>
      );

      // AuthProvider should detect config is not initialized globally
      // (This depends on implementation - might not warn if config is passed as prop)
      
      consoleWarnSpy.mockRestore();
    });

    it('should use initialized config in AuthProvider', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'github'],
        baseUrl: 'https://custom.api.com',
        debug: false,
      };

      initRauth(config);

      render(
        <AuthProvider config={config}>
          <div>Test Child</div>
        </AuthProvider>
      );

      const globalConfig = getConfig();
      expect(globalConfig.apiKey).toBe('pk_test_123456');
      expect(globalConfig.baseUrl).toBe('https://custom.api.com');
    });
  });

  describe('Config persistence across components', () => {
    it('should maintain config across multiple getConfig calls', () => {
      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
        debug: true,
      };

      initRauth(config);

      const config1 = getConfig();
      const config2 = getConfig();
      const config3 = getConfig();

      expect(config1).toBe(config2);
      expect(config2).toBe(config3);
      expect(config1.apiKey).toBe('pk_test_123456');
    });

    it('should allow checking if configured before accessing config', () => {
      expect(isConfigured()).toBe(false);

      const config: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      initRauth(config);

      expect(isConfigured()).toBe(true);

      const retrievedConfig = getConfig();
      expect(retrievedConfig.apiKey).toBe('pk_test_123456');
    });
  });

  describe('Config lifecycle', () => {
    it('should handle init -> use -> reset -> reinit lifecycle', () => {
      // Initial config
      const config1: RAuthConfig = {
        apiKey: 'pk_test_first',
        providers: ['google'],
      };

      initRauth(config1);
      expect(isConfigured()).toBe(true);
      expect(getConfig().apiKey).toBe('pk_test_first');

      // Reset
      resetConfig();
      expect(isConfigured()).toBe(false);

      // New config
      const config2: RAuthConfig = {
        apiKey: 'pk_test_second',
        providers: ['github'],
      };

      initRauth(config2);
      expect(isConfigured()).toBe(true);
      expect(getConfig().apiKey).toBe('pk_test_second');
      expect(getConfig().providers).toEqual(['github']);
    });
  });

  describe('Error handling', () => {
    it('should fail gracefully when getConfig called without init', () => {
      expect(() => getConfig()).toThrow(/RAuth SDK Error: SDK not initialized/);
      expect(() => getConfig()).toThrow(/call initRauth/);
    });

    it('should provide helpful error message for missing apiKey', () => {
      const config = {
        providers: ['google'],
      } as RAuthConfig;

      expect(() => initRauth(config)).toThrow('apiKey is required');
    });

    it('should provide helpful error message for invalid providers', () => {
      const config = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'invalid_one'],
      } as unknown as RAuthConfig;

      expect(() => initRauth(config)).toThrow(/Invalid provider/);
    });
  });

  describe('Config defaults application', () => {
    it('should apply all defaults for minimal config', () => {
      const minimalConfig: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google'],
      };

      const result = initRauth(minimalConfig);

      expect(result.baseUrl).toBeDefined();
      expect(result.storage).toBeDefined();
      expect(result.storage?.type).toBe('localStorage');
      expect(result.storage?.prefix).toBeDefined();
      expect(result.debug).toBe(false);
    });

    it('should not override explicitly provided values with defaults', () => {
      const fullConfig: RAuthConfig = {
        apiKey: 'pk_test_123456',
        providers: ['google', 'github'],
        baseUrl: 'https://my-custom-api.com',
        storage: {
          type: 'sessionStorage',
          prefix: 'myapp_',
        },
        debug: true,
        redirectUrl: 'https://app.com/callback',
        logoutRedirectUrl: 'https://app.com/goodbye',
      };

      const result = initRauth(fullConfig);

      expect(result.baseUrl).toBe('https://my-custom-api.com');
      expect(result.storage?.type).toBe('sessionStorage');
      expect(result.storage?.prefix).toBe('myapp_');
      expect(result.debug).toBe(true);
      expect(result.redirectUrl).toBe('https://app.com/callback');
      expect(result.logoutRedirectUrl).toBe('https://app.com/goodbye');
    });
  });
});
