/**
 * useSession hook - Session management and token refresh
 */

import { useEffect, useCallback } from 'react';
import { refreshToken } from '../utils/api';
import { storage } from '../utils/storage';
import { isTokenExpired } from '../utils/jwt';

interface UseSessionOptions {
  autoRefresh?: boolean;
  onTokenRefreshed?: () => void;
  onRefreshError?: (error: Error) => void;
}

/**
 * Hook to manage session and handle token refresh
 */
export function useSession(options: UseSessionOptions = {}) {
  const { autoRefresh = true, onTokenRefreshed, onRefreshError } = options;

  const handleRefreshToken = useCallback(async () => {
    try {
      const response = await refreshToken();
      storage.setAccessToken(response.accessToken);
      storage.setRefreshToken(response.refreshToken);
      onTokenRefreshed?.();
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      onRefreshError?.(err);
      return false;
    }
  }, [onTokenRefreshed, onRefreshError]);

  useEffect(() => {
    if (!autoRefresh) return;

    const checkAndRefreshToken = async () => {
      const token = storage.getAccessToken();
      if (token && isTokenExpired(token)) {
        await handleRefreshToken();
      }
    };

    // Check immediately
    checkAndRefreshToken();

    // Check every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, handleRefreshToken]);

  return {
    refreshToken: handleRefreshToken,
  };
}
