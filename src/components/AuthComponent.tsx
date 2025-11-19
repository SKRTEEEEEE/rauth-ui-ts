/**
 * AuthComponent - Single component handling login, logout, and profile display
 * 
 * This is the main authentication component of the RAuth SDK.
 * It automatically detects authentication state and adapts its UI:
 * - Shows login buttons when user is not authenticated
 * - Shows user profile and logout button when authenticated
 * - Supports multiple OAuth providers (Google, GitHub, Facebook, etc.)
 * 
 * @example
 * ```tsx
 * // Single provider
 * <AuthComponent provider="google" />
 * 
 * // Multiple providers
 * <AuthComponent providers={['google', 'github']} />
 * 
 * // With callbacks
 * <AuthComponent 
 *   provider="google"
 *   onLoginSuccess={() => console.log('Logged in!')}
 *   onLogoutSuccess={() => console.log('Logged out!')}
 *   onError={(err) => console.error(err)}
 * />
 * 
 * // With customization
 * <AuthComponent 
 *   providers={['google', 'github']}
 *   className="my-custom-auth"
 *   showAvatar={true}
 *   loginButtonText="Sign in with {provider}"
 *   logoutButtonText="Sign out"
 * />
 * ```
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { ProviderName } from '../utils/types';
import { getOAuthAuthorizeUrl, deleteSession } from '../utils/api';
import { storage } from '../utils/storage';

/**
 * Props for the AuthComponent
 */
export interface AuthComponentProps {
  /**
   * Single OAuth provider to use for login
   * If specified, only this provider's login button will be shown
   * Mutually exclusive with 'providers' prop
   */
  provider?: ProviderName;
  
  /**
   * Array of OAuth providers to show login buttons for
   * If not specified, defaults to providers from config or ['google', 'github']
   * Mutually exclusive with 'provider' prop
   */
  providers?: ProviderName[];
  
  /**
   * Additional CSS class names to apply to the container
   */
  className?: string;
  
  /**
   * Whether to show the user's avatar image when authenticated
   * @default true
   */
  showAvatar?: boolean;
  
  /**
   * Custom text for login buttons
   * Use {provider} as placeholder for provider name
   * @default "Login with {provider}"
   */
  loginButtonText?: string;
  
  /**
   * Custom text for the logout button
   * @default "Logout"
   */
  logoutButtonText?: string;
  
  /**
   * Callback invoked after successful login initiation
   * Note: This is called when OAuth flow starts, not when login completes
   */
  onLoginSuccess?: () => void;
  
  /**
   * Callback invoked after successful logout
   */
  onLogoutSuccess?: () => void;
  
  /**
   * Callback invoked when an error occurs during login or logout
   */
  onError?: (error: Error) => void;
}

/**
 * AuthComponent - Main authentication component
 * 
 * Automatically detects authentication state and renders appropriate UI:
 * 1. Loading state: Shows spinner while checking authentication
 * 2. Not authenticated: Shows OAuth provider login buttons
 * 3. Authenticated: Shows user profile with avatar, name, and logout button
 * 
 * The component integrates with:
 * - useAuth hook for authentication state
 * - Global config for provider list and settings
 * - API utilities for OAuth flow and session management
 * - Storage utilities for token management
 */
export function AuthComponent({
  provider,
  providers,
  className = '',
  showAvatar = true,
  loginButtonText,
  logoutButtonText = 'Logout',
  onLoginSuccess,
  onLogoutSuccess,
  onError,
}: AuthComponentProps) {
  const { isAuthenticated, user, loading, config } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Determine which providers to show
   * Priority:
   * 1. Single provider prop (if specified)
   * 2. Providers array prop (if specified)
   * 3. Providers from SDK config (if configured)
   * 4. Default to ['google', 'github']
   */
  const getProvidersToShow = (): ProviderName[] => {
    // Single provider mode
    if (provider) {
      return [provider];
    }
    
    // Multiple providers mode - use prop if provided
    if (providers && providers.length > 0) {
      return providers;
    }
    
    // Fall back to config providers if available
    if (config?.providers && config.providers.length > 0) {
      return config.providers;
    }
    
    // Ultimate fallback
    return ['google', 'github'];
  };

  /**
   * Get formatted login button text
   * Replaces {provider} placeholder with actual provider name
   */
  const getLoginButtonText = (providerName: ProviderName): string => {
    if (loginButtonText) {
      return loginButtonText.replace('{provider}', capitalize(providerName));
    }
    return `Login with ${capitalize(providerName)}`;
  };

  /**
   * Handle login button click
   * Initiates OAuth flow by redirecting to provider
   */
  const handleLogin = async (selectedProvider: ProviderName) => {
    try {
      setActionLoading(true);
      
      // Generate OAuth authorization URL
      const authUrl = getOAuthAuthorizeUrl(selectedProvider);
      
      // Call success callback before redirect
      onLoginSuccess?.();
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      onError?.(err);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle logout button click
   * Calls backend to delete session, clears local storage, and reloads page
   */
  const handleLogout = async () => {
    try {
      setActionLoading(true);
      const sessionId = storage.getSessionId();
      
      // Delete session on backend if we have a session ID
      if (sessionId) {
        await deleteSession(sessionId);
      }
      
      // Clear all local auth data
      storage.clear();
      
      // Call success callback
      onLogoutSuccess?.();
      
      // Reload page to reset application state
      window.location.reload();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Logout failed');
      onError?.(err);
    } finally {
      setActionLoading(false);
    }
  };

  // LOADING STATE
  if (loading) {
    return (
      <div className={`rauth-loading ${className}`.trim()} style={styles.container}>
        <div style={styles.spinner} aria-label="Loading authentication state">
          <span style={styles.spinnerText}>Loading...</span>
        </div>
      </div>
    );
  }

  // AUTHENTICATED STATE
  if (isAuthenticated && user) {
    return (
      <div className={`rauth-profile ${className}`.trim()} style={styles.container}>
        <div className="rauth-user-info" style={styles.userInfo}>
          {/* Avatar */}
          {showAvatar && user.avatar && (
            <img 
              src={user.avatar} 
              alt={user.name || user.email} 
              style={styles.avatar}
              className="rauth-avatar"
            />
          )}
          
          {/* User details */}
          <div className="rauth-user-details" style={styles.userDetails}>
            <p style={styles.userName} className="rauth-user-name">
              {user.name || user.email}
            </p>
            {user.name && (
              <small style={styles.userEmail} className="rauth-user-email">
                {user.email}
              </small>
            )}
          </div>
        </div>
        
        {/* Logout button */}
        <button 
          onClick={handleLogout} 
          disabled={actionLoading}
          style={actionLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
          className="rauth-logout-button"
          aria-label="Logout"
        >
          {actionLoading ? 'Logging out...' : logoutButtonText}
        </button>
      </div>
    );
  }

  // NOT AUTHENTICATED STATE
  const providersToShow = getProvidersToShow();

  return (
    <div className={`rauth-login ${className}`.trim()} style={styles.container}>
      <div className="rauth-providers" style={styles.providers}>
        {providersToShow.map((p) => (
          <button 
            key={p} 
            onClick={() => handleLogin(p)} 
            disabled={actionLoading}
            style={actionLoading ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
            className={`rauth-login-button rauth-login-${p}`}
            aria-label={`Login with ${capitalize(p)}`}
          >
            {actionLoading ? 'Loading...' : getLoginButtonText(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Capitalize first letter of string
 * @internal
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Basic inline styles for the component
 * These provide sensible defaults but can be overridden with CSS classes
 */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  },
  
  spinnerText: {
    color: '#666',
    fontSize: '14px',
  },
  
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
  },
  
  userDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  
  userName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    color: '#333',
  },
  
  userEmail: {
    fontSize: '14px',
    color: '#666',
  },
  
  providers: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    backgroundColor: '#4285f4',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    outline: 'none',
  },
  
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
};
