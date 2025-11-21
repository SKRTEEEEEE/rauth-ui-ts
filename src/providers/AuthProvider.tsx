/**
 * AuthProvider - Context provider for authentication state
 */

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import type { AuthState, RAuthConfig, ProviderName, User, Session } from '../utils/types';
import { storage, getSession } from '../utils/storage';
import { getCurrentUser } from '../utils/api';
import { isTokenExpired } from '../utils/jwt';
import { isConfigured } from '../utils/config';
import { initiateOAuth, handleOAuthCallback } from '../utils/oauth';

/**
 * Extended AuthContext type with functions and config
 */
interface AuthContextType extends AuthState {
  login: (provider: ProviderName) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  config?: RAuthConfig;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  config: RAuthConfig;
  /**
   * Initial session to use for SSR hydration
   * Pass session data from server to avoid loading state and hydration mismatches
   */
  initialSession?: { user: User; session: Session } | null;
}

/**
 * Authentication provider component
 * Wraps the app to provide auth state to all components
 */
export function AuthProvider({ children, config, initialSession }: AuthProviderProps) {
  // Initialize state from initialSession if provided (for SSR)
  const [state, setState] = useState<AuthState>(() => {
    // If initialSession is explicitly provided (even if null), use it
    if (initialSession !== undefined) {
      if (initialSession === null) {
        return {
          isAuthenticated: false,
          user: null,
          session: null,
          loading: false,
        };
      }
      
      // Validate initialSession has valid data
      if (initialSession.user && initialSession.session) {
        // Check if session is expired
        const isExpired = initialSession.session.expiresAt <= Date.now();
        
        if (!isExpired) {
          return {
            isAuthenticated: true,
            user: initialSession.user,
            session: initialSession.session,
            loading: false,
          };
        }
      }
      
      // Invalid or expired initialSession
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        loading: false,
      };
    }
    
    // No initialSession provided, start with loading state
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      loading: true,
    };
  });

  /**
   * Login function
   * Initiates OAuth flow by redirecting to provider
   */
  const login = useCallback(async (provider: ProviderName) => {
    console.log(`[AuthProvider] Initiating OAuth flow with provider: ${provider}`);
    
    try {
      // Initiate OAuth - this will redirect the browser
      initiateOAuth(provider);
    } catch (error) {
      console.error('[AuthProvider] Failed to initiate OAuth:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initiate login',
      }));
    }
  }, []);

  /**
   * Logout function
   * Clears state and storage
   */
  const logout = useCallback(async () => {
    console.log('[AuthProvider] logout called');
    
    // Clear storage
    storage.clear();
    
    // Clear state
    setState({
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
    });
  }, []);

  /**
   * Refresh session placeholder function
   * Will be implemented in task 4-5
   */
  const refreshSession = useCallback(async () => {
    console.log('[AuthProvider] refreshSession called (placeholder - will be implemented in task 4-5)');
    // TODO: Implement in task 4-5
  }, []);

  useEffect(() => {
    // Skip initialization if initialSession was provided
    // This prevents loading flash and hydration mismatches in SSR
    if (initialSession !== undefined) {
      return;
    }

    // Warn if global config is not initialized
    if (!isConfigured()) {
      console.warn(
        '[RAuth SDK] Warning: AuthProvider is being used but initRauth() has not been called. ' +
        'It is recommended to call initRauth() before mounting AuthProvider. ' +
        'Using config passed as prop instead.'
      );
    }

    // Check for OAuth callback in URL
    const handleOAuthCallbackIfPresent = async () => {
      if (typeof window === 'undefined') return false;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      // If no OAuth params, return false
      if (!code && !error) return false;

      console.log('[AuthProvider] Detected OAuth callback in URL');

      try {
        if (error) {
          const errorDescription = params.get('error_description') || error;
          throw new Error(`OAuth error: ${errorDescription}`);
        }

        // Handle OAuth callback
        const loginResponse = await handleOAuthCallback(params);

        // Update state with user and session
        setState({
          isAuthenticated: true,
          user: loginResponse.user,
          session: loginResponse.session,
          loading: false,
        });

        // Call onLoginSuccess callback if provided
        if (config.onLoginSuccess) {
          config.onLoginSuccess(loginResponse.user);
        }

        // Clean up URL params
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        return true;
      } catch (error) {
        console.error('[AuthProvider] OAuth callback failed:', error);
        
        setState({
          isAuthenticated: false,
          user: null,
          session: null,
          loading: false,
          error: error instanceof Error ? error.message : 'OAuth callback failed',
        });

        // Call onError callback if provided
        if (config.onError) {
          config.onError(error instanceof Error ? error.message : 'OAuth callback failed');
        }

        // Clean up URL params even on error
        if (window.history && window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        return true;
      }
    };

    // Check for existing session
    const initAuth = async () => {
      try {
        // First check if this is an OAuth callback
        const wasCallback = await handleOAuthCallbackIfPresent();
        if (wasCallback) {
          // Callback was handled, don't continue with normal init
          return;
        }

        // Try to load session from storage
        const sessionData = getSession();
        
        if (sessionData) {
          // Session exists in storage
          setState({
            isAuthenticated: true,
            user: sessionData.user,
            session: sessionData.session,
            loading: false,
          });
          return;
        }

        // Check for token (legacy support)
        const token = storage.getAccessToken();
        
        if (!token || isTokenExpired(token)) {
          setState({
            isAuthenticated: false,
            user: null,
            session: null,
            loading: false,
          });
          return;
        }

        // Token exists and is valid, fetch user
        const user = await getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          session: null,
          loading: false,
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          user: null,
          session: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    };

    initAuth();
  }, [config.apiKey, config.baseUrl, initialSession]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshSession,
    config,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access auth context
 * Throws error if used outside AuthProvider
 * 
 * @returns AuthContext value
 * @throws Error if used outside AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}
