/**
 * AuthProvider - Context provider for authentication state
 */

import { createContext, useState, useEffect, ReactNode } from 'react';
import type { AuthState, RAuthConfig } from '../utils/types';
import { storage } from '../utils/storage';
import { getCurrentUser, initApi } from '../utils/api';
import { isTokenExpired } from '../utils/jwt';

export const AuthContext = createContext<AuthState | undefined>(undefined);

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
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Initialize API with config
    initApi(config.apiKey, config.baseUrl);

    // Check for existing session
    const initAuth = async () => {
      try {
        const token = storage.getAccessToken();
        
        if (!token || isTokenExpired(token)) {
          setState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          });
          return;
        }

        // Token exists and is valid, fetch user
        const user = await getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Authentication failed'),
        });
      }
    };

    initAuth();
  }, [config.apiKey, config.baseUrl]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
