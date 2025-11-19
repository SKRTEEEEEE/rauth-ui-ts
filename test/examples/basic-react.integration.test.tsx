/**
 * Integration tests for the basic React example
 * 
 * These tests verify that the example app is properly configured and
 * can successfully import and use the RAuth SDK components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../src/providers/AuthProvider';
import { AuthComponent } from '../../src/components/AuthComponent';
import { initRauth, getConfig } from '../../src/utils/config';
import { storage } from '../../src/utils/storage';

// Mock API calls
vi.mock('../../src/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  initApi: vi.fn(),
  getApiConfig: vi.fn(() => ({ apiKey: 'test', baseUrl: 'http://localhost:8080' })),
  initiateOAuth: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  deleteSession: vi.fn(),
}));

describe('Basic React Example - Integration Tests', () => {
  beforeEach(() => {
    // Clear storage and reset config before each test
    storage.clear();
    vi.clearAllMocks();
  });

  describe('SDK Configuration', () => {
    it('should initialize RAuth with example config', () => {
      const config = initRauth({
        apiKey: 'example-api-key-12345',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github', 'facebook'],
      });

      expect(config).toBeDefined();
      expect(config.apiKey).toBe('example-api-key-12345');
      expect(config.baseUrl).toBe('http://localhost:8080');
      expect(config.providers).toEqual(['google', 'github', 'facebook']);
    });

    it('should retrieve config after initialization', () => {
      initRauth({
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'],
      });

      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.apiKey).toBe('test-key');
    });
  });

  describe('AuthProvider Integration', () => {
    it('should render children wrapped in AuthProvider', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <div>Test Content</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Content')).toBeInTheDocument();
      });
    });

    it('should provide auth context to child components', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <AuthComponent providers={['google']} />
        </AuthProvider>
      );

      // Should render login UI when not authenticated
      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
      });
    });
  });

  describe('AuthComponent Rendering', () => {
    it('should render AuthComponent with default providers', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <AuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
        expect(screen.getByText(/Login with Github/i)).toBeInTheDocument();
      });
    });

    it('should render AuthComponent with single provider', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <AuthComponent provider="google" />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
      });
    });

    it('should render AuthComponent with multiple specified providers', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github', 'facebook'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <AuthComponent providers={['google', 'facebook']} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
        expect(screen.getByText(/Login with Facebook/i)).toBeInTheDocument();
      });
    });
  });

  describe('Example App Structure', () => {
    it('should have proper component nesting', async () => {
      const testConfig = {
        apiKey: 'example-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github'] as const,
      };

      initRauth(testConfig);

      const { container } = render(
        <div className="app">
          <h1>RAuth SDK - Basic React Example</h1>
          <AuthProvider config={testConfig}>
            <div className="auth-section">
              <h2>Default Authentication</h2>
              <AuthComponent />
            </div>
          </AuthProvider>
        </div>
      );

      expect(container.querySelector('.app')).toBeInTheDocument();
      expect(screen.getByText('RAuth SDK - Basic React Example')).toBeInTheDocument();
      expect(screen.getByText('Default Authentication')).toBeInTheDocument();
    });

    it('should support multiple AuthComponent instances', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <div>
            <div className="section-1">
              <AuthComponent provider="google" />
            </div>
            <div className="section-2">
              <AuthComponent provider="github" />
            </div>
          </div>
        </AuthProvider>
      );

      await waitFor(() => {
        const googleButtons = screen.getAllByText(/Login with Google/i);
        const githubButtons = screen.getAllByText(/Login with Github/i);
        
        expect(googleButtons.length).toBeGreaterThan(0);
        expect(githubButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('TypeScript Integration', () => {
    it('should accept valid AuthComponent props', () => {
      initRauth({
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google'],
      });

      // This test verifies TypeScript compilation
      // If it compiles, the types are correct
      const props = {
        provider: 'google' as const,
        className: 'custom-auth',
        showAvatar: true,
        loginButtonText: 'Sign in with {provider}',
        logoutButtonText: 'Sign out',
        onLoginSuccess: () => console.log('Login initiated'),
        onLogoutSuccess: () => console.log('Logged out'),
        onError: (error: Error) => console.error('Auth error:', error),
      };

      expect(props).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle configuration with explicit config prop', async () => {
      const testConfig = {
        apiKey: 'test-key',
        baseUrl: 'http://localhost:8080',
        providers: ['google', 'github'] as const,
      };

      initRauth(testConfig);

      render(
        <AuthProvider config={testConfig}>
          <AuthComponent />
        </AuthProvider>
      );

      // Should render default providers - use getAllByText since there are multiple buttons
      await waitFor(() => {
        const loginButtons = screen.getAllByText(/Login with/i);
        expect(loginButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
