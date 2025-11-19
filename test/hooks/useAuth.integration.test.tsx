/**
 * Integration tests for useAuth hook
 * Tests real usage scenarios with AuthProvider
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/providers/AuthProvider';
import type { User, Session } from '../../src/utils/types';

// Mock storage utilities
vi.mock('../../src/utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(() => null),
    getRefreshToken: vi.fn(() => null),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clear: vi.fn(),
  },
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'rauth_access_token',
    REFRESH_TOKEN: 'rauth_refresh_token',
  },
}));

// Mock API utilities
vi.mock('../../src/utils/api', () => ({
  initApi: vi.fn(),
  getCurrentUser: vi.fn(),
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test component that uses useAuth
function TestComponent() {
  const { isAuthenticated, user, session, loading, login, logout, refreshSession, config } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="session">{session ? session.id : 'null'}</div>
      <div data-testid="config-apikey">{config?.apiKey || 'null'}</div>
      <button onClick={() => login('google')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => refreshSession()}>Refresh</button>
    </div>
  );
}

const TEST_CONFIG = { apiKey: 'mock-key-for-unit-tests' };

describe('useAuth integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render component with useAuth inside AuthProvider', async () => {
    render(
      <AuthProvider config={TEST_CONFIG}>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that component rendered
    expect(screen.getByTestId('authenticated')).toBeInTheDocument();
  });

  it('should display correct initial state (unauthenticated)', async () => {
    render(
      <AuthProvider config={TEST_CONFIG}>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should be unauthenticated initially
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('session')).toHaveTextContent('null');
  });

  it('should expose config from AuthProvider', async () => {
    const customConfig = { 
      apiKey: 'custom-mock-key-abc',
      baseUrl: 'https://test.example.com'
    };

    render(
      <AuthProvider config={customConfig}>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('config-apikey')).toHaveTextContent('custom-mock-key-abc');
  });

  it('should render buttons that use auth functions', async () => {
    render(
      <AuthProvider config={TEST_CONFIG}>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Buttons should be rendered
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should allow clicking auth function buttons without crashing', async () => {
    render(
      <AuthProvider config={TEST_CONFIG}>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const loginButton = screen.getByText('Login');
    const logoutButton = screen.getByText('Logout');
    const refreshButton = screen.getByText('Refresh');

    // Should not throw when clicking
    expect(() => loginButton.click()).not.toThrow();
    expect(() => logoutButton.click()).not.toThrow();
    expect(() => refreshButton.click()).not.toThrow();
  });

  it('should handle multiple components using useAuth simultaneously', async () => {
    function MultipleComponents() {
      return (
        <>
          <TestComponent />
          <TestComponent />
        </>
      );
    }

    render(
      <AuthProvider config={TEST_CONFIG}>
        <MultipleComponents />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryAllByText('Loading...').length).toBe(0);
    });

    // Both components should have access to the same auth state
    const authenticatedElements = screen.getAllByTestId('authenticated');
    expect(authenticatedElements).toHaveLength(2);
    expect(authenticatedElements[0]).toHaveTextContent('false');
    expect(authenticatedElements[1]).toHaveTextContent('false');
  });

  it('should throw error when component tries to use useAuth outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    console.error = originalError;
  });
});
