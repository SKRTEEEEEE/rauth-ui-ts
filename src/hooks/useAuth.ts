/**
 * useAuth hook - Main authentication state hook
 * 
 * Provides access to authentication state, user info, and authentication functions.
 * This is the primary interface for components to interact with authentication.
 * 
 * @returns {UseAuthReturn} Object containing:
 *   - isAuthenticated: boolean indicating if user is authenticated
 *   - user: Current user information (null if not authenticated)
 *   - session: Current session information (null if not authenticated)
 *   - loading: boolean indicating if authentication state is loading
 *   - error: Optional error message
 *   - login: Function to initiate OAuth login
 *   - logout: Function to log out current user
 *   - refreshSession: Function to refresh the current session
 *   - config: RAuth configuration
 * 
 * @throws {Error} If used outside of AuthProvider context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, login, logout } = useAuth();
 * 
 *   if (isAuthenticated) {
 *     return <div>Welcome {user.name}! <button onClick={logout}>Logout</button></div>;
 *   }
 * 
 *   return <button onClick={() => login('google')}>Login with Google</button>;
 * }
 * ```
 */

import { useContext, useMemo } from 'react';
import { AuthContext } from '../providers/AuthProvider';
import type { User, Session, ProviderName, RAuthConfig } from '../utils/types';

/**
 * Return type for useAuth hook
 * Extends AuthState with authentication functions
 */
export interface UseAuthReturn {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
  /** Current user information (null if not authenticated) */
  user: User | null;
  /** Current session information (null if not authenticated) */
  session: Session | null;
  /** Whether authentication state is being loaded */
  loading: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** Function to initiate OAuth login with specified provider */
  login: (provider: ProviderName) => Promise<void>;
  /** Function to log out the current user */
  logout: () => Promise<void>;
  /** Function to refresh the current session */
  refreshSession: () => Promise<void>;
  /** RAuth SDK configuration */
  config?: RAuthConfig;
}

/**
 * Hook to access authentication state and functions
 * 
 * Must be used within AuthProvider. Provides a clean API for components
 * to access authentication state and perform authentication operations.
 * 
 * The isAuthenticated property is computed based on:
 * - User exists (not null)
 * - Session exists (not null)
 * - Session has not expired (expiresAt > current time)
 * 
 * @returns {UseAuthReturn} Authentication state and functions
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Compute isAuthenticated based on user, session, and expiration
  const isAuthenticated = useMemo(() => {
    // User must exist
    if (!context.user) {
      return false;
    }

    // Session must exist
    if (!context.session) {
      return false;
    }

    // Session must not be expired
    if (context.session.expiresAt <= Date.now()) {
      return false;
    }

    return true;
  }, [context.user, context.session]);

  return {
    isAuthenticated,
    user: context.user,
    session: context.session,
    loading: context.loading,
    error: context.error,
    login: context.login,
    logout: context.logout,
    refreshSession: context.refreshSession,
    config: context.config,
  };
}
