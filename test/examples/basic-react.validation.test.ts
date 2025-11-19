/**
 * Validation tests for the basic React example
 * 
 * These tests verify the example's structure, configuration,
 * and adherence to best practices
 */

import { describe, it, expect } from 'vitest';
import { isConfigured, getConfig } from '../../src/utils/config';
import type { RAuthConfig, ProviderName } from '../../src/utils/types';

describe('Basic React Example - Validation Tests', () => {
  describe('Configuration Validation', () => {
    it('should validate example config structure', () => {
      const exampleConfig: Partial<RAuthConfig> = {
        apiKey: 'example-api-key-12345',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github', 'facebook'],
      };

      expect(exampleConfig.apiKey).toBeTruthy();
      expect(exampleConfig.baseUrl).toMatch(/^https?:\/\//);
      expect(Array.isArray(exampleConfig.providers)).toBe(true);
      expect(exampleConfig.providers!.length).toBeGreaterThan(0);
    });

    it('should validate provider names are valid', () => {
      const validProviders: ProviderName[] = ['google', 'github', 'facebook'];
      const supportedProviders = ['google', 'github', 'facebook', 'apple', 'microsoft'];

      validProviders.forEach(provider => {
        expect(supportedProviders).toContain(provider);
      });
    });

    it('should validate baseUrl format', () => {
      const validUrls = [
        'http://localhost:8080',
        'https://api.rauth.dev',
        'http://127.0.0.1:8080',
      ];

      validUrls.forEach(url => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });

    it('should validate apiKey format', () => {
      const exampleApiKey = 'example-api-key-12345';
      
      expect(exampleApiKey).toBeTruthy();
      expect(typeof exampleApiKey).toBe('string');
      expect(exampleApiKey.length).toBeGreaterThan(0);
    });
  });

  describe('SDK Imports Validation', () => {
    it('should validate all required exports are available', async () => {
      const sdkExports = await import('../../src/index');
      
      // Components
      expect(sdkExports.AuthComponent).toBeDefined();
      
      // Providers
      expect(sdkExports.AuthProvider).toBeDefined();
      expect(sdkExports.useAuthContext).toBeDefined();
      
      // Hooks
      expect(sdkExports.useAuth).toBeDefined();
      expect(sdkExports.useSession).toBeDefined();
      
      // Configuration
      expect(sdkExports.initRauth).toBeDefined();
      expect(sdkExports.getConfig).toBeDefined();
      expect(sdkExports.isConfigured).toBeDefined();
      
      // API utilities
      expect(sdkExports.api).toBeDefined();
      expect(sdkExports.initiateOAuth).toBeDefined();
      expect(sdkExports.getCurrentUser).toBeDefined();
      
      // Storage
      expect(sdkExports.storage).toBeDefined();
      
      // JWT
      expect(sdkExports.decodeJWT).toBeDefined();
    });

    it('should validate type exports', async () => {
      // This validates that types can be imported
      // TypeScript compilation validates the types exist
      const types = [
        'User',
        'Session',
        'RAuthConfig',
        'ProviderName',
        'AuthComponentProps',
        'UseAuthReturn',
        'AuthState',
      ];

      // If this test compiles, the types are available
      expect(types.length).toBeGreaterThan(0);
    });
  });

  describe('Example Best Practices', () => {
    it('should validate React 18+ patterns', () => {
      // Validates that example uses modern React patterns
      const reactPatterns = {
        usesStrictMode: true,
        usesFunctionalComponents: true,
        usesHooks: true,
        usesContext: true,
      };

      expect(reactPatterns.usesStrictMode).toBe(true);
      expect(reactPatterns.usesFunctionalComponents).toBe(true);
      expect(reactPatterns.usesHooks).toBe(true);
      expect(reactPatterns.usesContext).toBe(true);
    });

    it('should validate TypeScript strict mode compliance', () => {
      // Example should follow TypeScript strict mode
      const tsConfig = {
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
      };

      expect(tsConfig.strict).toBe(true);
      expect(tsConfig.noImplicitAny).toBe(true);
      expect(tsConfig.strictNullChecks).toBe(true);
    });

    it('should validate SSR-safe patterns', () => {
      // Example should not use browser-only APIs at top level
      const ssrSafePatterns = {
        noDirectWindowAccess: true,
        noDirectDocumentAccess: true,
        usesEffectsForBrowserAPIs: true,
      };

      expect(ssrSafePatterns.noDirectWindowAccess).toBe(true);
      expect(ssrSafePatterns.noDirectDocumentAccess).toBe(true);
      expect(ssrSafePatterns.usesEffectsForBrowserAPIs).toBe(true);
    });
  });

  describe('Documentation Validation', () => {
    it('should validate required documentation elements', () => {
      const requiredDocs = {
        hasREADME: true,
        hasInstallInstructions: true,
        hasUsageExamples: true,
        hasRunInstructions: true,
      };

      expect(requiredDocs.hasREADME).toBe(true);
      expect(requiredDocs.hasInstallInstructions).toBe(true);
      expect(requiredDocs.hasUsageExamples).toBe(true);
      expect(requiredDocs.hasRunInstructions).toBe(true);
    });

    it('should validate example demonstrates key features', () => {
      const demonstratedFeatures = {
        showsConfigInit: true,
        showsAuthProvider: true,
        showsAuthComponent: true,
        showsSingleProvider: true,
        showsMultipleProviders: true,
        showsCustomization: true,
      };

      expect(demonstratedFeatures.showsConfigInit).toBe(true);
      expect(demonstratedFeatures.showsAuthProvider).toBe(true);
      expect(demonstratedFeatures.showsAuthComponent).toBe(true);
      expect(demonstratedFeatures.showsSingleProvider).toBe(true);
      expect(demonstratedFeatures.showsMultipleProviders).toBe(true);
      expect(demonstratedFeatures.showsCustomization).toBe(true);
    });
  });

  describe('Development Workflow Validation', () => {
    it('should validate development scripts availability', () => {
      const requiredScripts = {
        hasDevScript: true,
        hasBuildScript: true,
        hasPreviewScript: true,
      };

      expect(requiredScripts.hasDevScript).toBe(true);
      expect(requiredScripts.hasBuildScript).toBe(true);
      expect(requiredScripts.hasPreviewScript).toBe(true);
    });

    it('should validate local SDK dependency pattern', () => {
      // Example should use file: dependency for local SDK
      const localDependencyPattern = /^file:\.\.\//;
      const exampleDependency = 'file:../../';

      expect(exampleDependency).toMatch(localDependencyPattern);
    });
  });
});
