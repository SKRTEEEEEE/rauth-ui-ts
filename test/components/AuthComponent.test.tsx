/**
 * AuthComponent Unit Tests
 * 
 * Comprehensive tests for the AuthComponent with real OAuth flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthComponent } from '../../src/components/AuthComponent';
import { AuthProvider } from '../../src/providers/AuthProvider';
import type { User, Session, RAuthConfig } from '../../src/utils/types';

// Mock API utilities
vi.mock('../../src/utils/api', () => ({
  getOAuthAuthorizeUrl: vi.fn((provider: string) => `https://backend.com/oauth/${provider}`),
  deleteSession: vi.fn(async () => ({ success: true })),
  getCurrentUser: vi.fn(),
}));

// Mock storage utilities
vi.mock('../../src/utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getSessionId: vi.fn(() => 'test-session-id'),
    clear: vi.fn(),
  },
  getSession: vi.fn(),
  saveSession: vi.fn(),
}));

// Mock OAuth utilities
vi.mock('../../src/utils/oauth', () => ({
  initiateOAuth: vi.fn(),
  handleOAuthCallback: vi.fn(),
  generateState: vi.fn(() => 'test-state'),
  validateState: vi.fn(() => true),
  getCallbackUrl: vi.fn(() => 'http://localhost:3000/auth/callback'),
}));

const mockConfig: RAuthConfig = {
  apiKey: 'test-api-key',
  baseUrl: 'https://api.rauth.dev',
  providers: ['google', 'github'],
};

const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: 'https://example.com/avatar.jpg',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSession: Session = {
  id: 'session-123',
  userId: '123',
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  expiresAt: Date.now() + 3600000,
  createdAt: '2024-01-01T00:00:00Z',
  provider: 'google',
};

describe('AuthComponent - Not Authenticated State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '', origin: 'http://localhost:3000', search: '' };
  });

  it('should render login buttons when not authenticated', () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent providers={['google', 'github']} />
      </AuthProvider>
    );

    // Should show Google and GitHub login buttons
    expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
    expect(screen.getByText(/Login with GitHub/i)).toBeInTheDocument();
  });

  it('should render single provider when provider prop is used', () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    // Should only show Google button
    expect(screen.getByText(/Login with Google/i)).toBeInTheDocument();
    expect(screen.queryByText(/Login with GitHub/i)).not.toBeInTheDocument();
  });

  it('should use custom login button text with {provider} placeholder', () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent 
          providers={['google']} 
          loginButtonText="Sign in with {provider}"
        />
      </AuthProvider>
    );

    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should initiate OAuth flow when login button is clicked', async () => {
    const { initiateOAuth } = await import('../../src/utils/oauth');
    
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    const loginButton = screen.getByText(/Login with Google/i);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(initiateOAuth).toHaveBeenCalledWith('google');
    });
  });

  it('should call onLoginSuccess callback when login is initiated', async () => {
    const onLoginSuccess = vi.fn();
    
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" onLoginSuccess={onLoginSuccess} />
      </AuthProvider>
    );

    const loginButton = screen.getByText(/Login with Google/i);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should show loading state during OAuth initiation', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    const loginButton = screen.getByText(/Login with Google/i);
    fireEvent.click(loginButton);

    // Button should show loading text
    await waitFor(() => {
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  it('should disable button during OAuth initiation', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    const loginButton = screen.getByText(/Login with Google/i);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });
  });

  it('should call onError callback when OAuth initiation fails', async () => {
    const onError = vi.fn();
    const { initiateOAuth } = await import('../../src/utils/oauth');
    
    // Mock initiateOAuth to throw error
    vi.mocked(initiateOAuth).mockImplementationOnce(() => {
      throw new Error('OAuth initiation failed');
    });

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" onError={onError} />
      </AuthProvider>
    );

    const loginButton = screen.getByText(/Login with Google/i);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('AuthComponent - Authenticated State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock getSession to return valid session
    const { getSession } = require('../../src/utils/storage');
    vi.mocked(getSession).mockReturnValue({
      user: mockUser,
      session: mockSession,
    });

    delete (window as any).location;
    (window as any).location = { 
      href: '', 
      origin: 'http://localhost:3000', 
      search: '',
      reload: vi.fn(),
    };
  });

  it('should render user info when authenticated', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    // Wait for auth state to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should show user avatar when showAvatar is true', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" showAvatar={true} />
      </AuthProvider>
    );

    await waitFor(() => {
      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  it('should not show avatar when showAvatar is false', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" showAvatar={false} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByAltText('Test User')).not.toBeInTheDocument();
    });
  });

  it('should show logout button when authenticated', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('should use custom logout button text', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" logoutButtonText="Sign out" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });
  });

  it('should call deleteSession and clear storage when logout is clicked', async () => {
    const { deleteSession } = await import('../../src/utils/api');
    const { storage } = await import('../../src/utils/storage');

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(deleteSession).toHaveBeenCalledWith('test-session-id');
      expect(storage.clear).toHaveBeenCalled();
    });
  });

  it('should call onLogoutSuccess callback when logout completes', async () => {
    const onLogoutSuccess = vi.fn();

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" onLogoutSuccess={onLogoutSuccess} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(onLogoutSuccess).toHaveBeenCalled();
    });
  });

  it('should show loading state during logout', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
    });
  });

  it('should reload page after logout', async () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('should call onError callback when logout fails', async () => {
    const onError = vi.fn();
    const { deleteSession } = await import('../../src/utils/api');
    
    // Mock deleteSession to throw error
    vi.mocked(deleteSession).mockRejectedValueOnce(new Error('Logout failed'));

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" onError={onError} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

describe('AuthComponent - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner while checking auth state', () => {
    // Mock loading state
    const { getSession } = require('../../src/utils/storage');
    vi.mocked(getSession).mockReturnValue(null);

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('AuthComponent - OAuth Callback Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    delete (window as any).location;
    (window as any).location = {
      href: '',
      origin: 'http://localhost:3000',
      search: '?code=test-code&state=test-state',
      pathname: '/auth/callback',
    };

    delete (window as any).history;
    (window as any).history = {
      replaceState: vi.fn(),
    };
  });

  it('should process OAuth callback and show user', async () => {
    const { handleOAuthCallback } = await import('../../src/utils/oauth');
    
    // Mock successful callback
    vi.mocked(handleOAuthCallback).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: Date.now() + 3600000,
    });

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(handleOAuthCallback).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should clean up URL parameters after callback', async () => {
    const { handleOAuthCallback } = await import('../../src/utils/oauth');
    
    vi.mocked(handleOAuthCallback).mockResolvedValueOnce({
      user: mockUser,
      session: mockSession,
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiresAt: Date.now() + 3600000,
    });

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        '/auth/callback'
      );
    });
  });
});

describe('AuthComponent - Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper aria-label on login buttons', () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    const loginButton = screen.getByLabelText('Login with Google');
    expect(loginButton).toBeInTheDocument();
  });

  it('should have proper aria-label on logout button', async () => {
    const { getSession } = require('../../src/utils/storage');
    vi.mocked(getSession).mockReturnValue({
      user: mockUser,
      session: mockSession,
    });

    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      const logoutButton = screen.getByLabelText('Logout');
      expect(logoutButton).toBeInTheDocument();
    });
  });

  it('should have aria-label on loading spinner', () => {
    render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    const loadingSpinner = screen.getByLabelText('Loading authentication state');
    expect(loadingSpinner).toBeInTheDocument();
  });
});

describe('AuthComponent - Custom Styling', () => {
  it('should apply custom className', () => {
    const { container } = render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" className="custom-auth" />
      </AuthProvider>
    );

    expect(container.querySelector('.custom-auth')).toBeInTheDocument();
  });

  it('should apply rauth-login class when not authenticated', () => {
    const { container } = render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    expect(container.querySelector('.rauth-login')).toBeInTheDocument();
  });

  it('should apply rauth-profile class when authenticated', async () => {
    const { getSession } = require('../../src/utils/storage');
    vi.mocked(getSession).mockReturnValue({
      user: mockUser,
      session: mockSession,
    });

    const { container } = render(
      <AuthProvider config={mockConfig}>
        <AuthComponent provider="google" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(container.querySelector('.rauth-profile')).toBeInTheDocument();
    });
  });
});
