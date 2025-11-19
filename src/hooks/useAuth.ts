/**
 * useAuth hook - Main authentication state hook
 * Provides current authentication state, user info, and loading status
 */

import { useContext } from 'react';
import { AuthContext } from '../providers/AuthProvider';
import type { AuthState } from '../utils/types';

/**
 * Hook to access authentication state
 * Must be used within AuthProvider
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
