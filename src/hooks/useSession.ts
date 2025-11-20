/**
 * useSession hook - Session management and token refresh
 * 
 * Provides comprehensive session management including:
 * - Automatic token refresh before expiration
 * - Manual refresh capability
 * - Session expiration detection
 * - Configurable refresh threshold and callbacks
 * 
 * @example
 * ```typescript
 * const { session, isExpired, refreshToken, timeUntilExpiration } = useSession({
 *   autoRefresh: true,
 *   refreshThreshold: 5 * 60 * 1000, // 5 minutes
 *   onRefreshSuccess: (tokens) => console.log('Refreshed!'),
 *   onRefreshError: (error) => console.error('Refresh failed:', error),
 *   onSessionExpired: () => console.log('Session expired'),
 * });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { refreshSession } from '../utils/api';
import { storage, getSession } from '../utils/storage';
import { isTokenExpired, getTokenExpiration } from '../utils/jwt';
import type { UseSessionOptions, Session, RefreshResponse } from '../utils/types';

/**
 * Default refresh threshold: 5 minutes before token expiration
 */
const DEFAULT_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Default check interval: Check token expiration every 1 minute
 */
const DEFAULT_CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds

/**
 * Return type for useSession hook
 */
export interface UseSessionReturn {
  /** Current session object or null if no session */
  session: Session | null;
  /** Whether the current session is expired */
  isExpired: boolean;
  /** Time in milliseconds until token expiration, or null if no token */
  timeUntilExpiration: number | null;
  /** Manually trigger token refresh */
  refreshToken: () => Promise<boolean>;
}

/**
 * Hook to manage session lifecycle and automatic token refresh
 * 
 * Features:
 * - Auto-refresh tokens before expiration (configurable threshold)
 * - Manual refresh capability
 * - Session expiration detection
 * - Automatic cleanup on expiration
 * - Configurable callbacks for all events
 * 
 * @param options - Configuration options for session management
 * @returns Session state and control functions
 */
export function useSession(options: UseSessionOptions = {}): UseSessionReturn {
  const {
    autoRefresh = true,
    refreshThreshold = DEFAULT_REFRESH_THRESHOLD,
    onRefreshSuccess,
    onRefreshError,
    onSessionExpired,
  } = options;

  // Track current session
  const [session, setSession] = useState<Session | null>(() => {
    const sessionData = getSession();
    return sessionData?.session || null;
  });

  /**
   * Calculate time until token expiration
   */
  const calculateTimeUntilExpiration = useCallback((): number | null => {
    const token = storage.getAccessToken();
    if (!token) return null;

    const expiration = getTokenExpiration(token);
    if (!expiration) return null;

    const timeUntil = expiration.getTime() - Date.now();
    return Math.max(0, timeUntil);
  }, []);

  /**
   * Check if current session is expired
   */
  const checkIsExpired = useCallback((): boolean => {
    const token = storage.getAccessToken();
    if (!token) return true;

    return isTokenExpired(token);
  }, []);

  /**
   * Handle token refresh
   * 
   * @returns Promise resolving to true if refresh succeeded, false otherwise
   */
  const handleRefreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentRefreshToken = storage.getRefreshToken();
      
      // No refresh token available
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh API
      const response: RefreshResponse = await refreshSession(currentRefreshToken);

      // Update storage with new tokens
      storage.setAccessToken(response.accessToken);
      storage.setRefreshToken(response.refreshToken);

      // Update session state
      const sessionData = getSession();
      if (sessionData) {
        setSession(sessionData.session);
      }

      // Call success callback
      onRefreshSuccess?.(response);

      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      
      // Call error callback
      onRefreshError?.(err.message);

      return false;
    }
  }, [onRefreshSuccess, onRefreshError]);

  /**
   * Handle session expiration
   * Clears session and storage, calls expiration callback
   */
  const handleSessionExpired = useCallback(() => {
    // Clear storage
    storage.clear();

    // Clear session state
    setSession(null);

    // Call expiration callback
    onSessionExpired?.();
  }, [onSessionExpired]);

  /**
   * Check if token needs refresh based on threshold
   * 
   * @returns true if refresh is needed
   */
  const shouldRefresh = useCallback((): boolean => {
    const timeUntil = calculateTimeUntilExpiration();
    
    // No token or already expired
    if (timeUntil === null || timeUntil === 0) {
      return true;
    }

    // Check if time until expiration is less than threshold
    return timeUntil < refreshThreshold;
  }, [calculateTimeUntilExpiration, refreshThreshold]);

  /**
   * Auto-refresh effect
   * Checks token expiration periodically and refreshes when needed
   */
  useEffect(() => {
    if (!autoRefresh) return;

    /**
     * Check and refresh token if needed
     */
    const checkAndRefresh = async () => {
      const token = storage.getAccessToken();
      
      // No token, nothing to refresh
      if (!token) return;

      // Check if token is already expired
      if (isTokenExpired(token)) {
        // Try to refresh
        const refreshToken = storage.getRefreshToken();
        
        if (!refreshToken) {
          // No refresh token, session is completely expired
          handleSessionExpired();
          return;
        }

        // Attempt refresh
        const success = await handleRefreshToken();
        
        if (!success) {
          // Refresh failed, session expired
          handleSessionExpired();
        }
        
        return;
      }

      // Check if token needs proactive refresh (within threshold)
      if (shouldRefresh()) {
        await handleRefreshToken();
      }
    };

    // Check immediately on mount
    checkAndRefresh();

    // Set up interval to check periodically
    const interval = setInterval(checkAndRefresh, DEFAULT_CHECK_INTERVAL);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefreshToken, handleSessionExpired, shouldRefresh]);

  /**
   * Update session state when storage changes
   * (e.g., from other tabs or after refresh)
   */
  useEffect(() => {
    // Check if running in browser (SSR-safe)
    if (typeof window === 'undefined') return;

    const syncSession = () => {
      const sessionData = getSession();
      setSession(sessionData?.session || null);
    };

    // Listen for storage events (cross-tab synchronization)
    window.addEventListener('storage', syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  return {
    session,
    isExpired: checkIsExpired(),
    timeUntilExpiration: calculateTimeUntilExpiration(),
    refreshToken: handleRefreshToken,
  };
}
