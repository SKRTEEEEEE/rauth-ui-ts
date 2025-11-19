/**
 * AuthProvider - Context provider for authentication state
 */

import { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import type { AuthState, RAuthConfig, ProviderName } from '../utils/types';
import { storage } from '../utils/storage';
import { getCurrentUser } from '../utils/api';
import { isTokenExpired } from '../utils/jwt';
import { isConfigured } from '../utils/config';

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
}

/**
 * Authentication provider component
 * Wraps the app to provide auth state to all components
 */
export function AuthProvider({ children, config }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: true,
  });

  /**
   * Login placeholder function
   * Will be implemented in task 4-4
   */
  const login = useCallback(async (provider: ProviderName) => {
    console.log(`[AuthProvider] login called with provider: ${provider} (placeholder - will be implemented in task 4-4)`);
    // TODO: Implement in task 4-4
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
    // Warn if global config is not initialized
    if (!isConfigured()) {
      console.warn(
        '[RAuth SDK] Warning: AuthProvider is being used but initRauth() has not been called. ' +
        'It is recommended to call initRauth() before mounting AuthProvider. ' +
        'Using config passed as prop instead.'
      );
    }

    // Check for existing session
    const initAuth = async () => {
      try {
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
          session: null, // TODO: Load session from storage
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
  }, [config.apiKey, config.baseUrl]);

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
