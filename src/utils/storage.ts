/**
 * Storage utilities for managing tokens and session data
 * Compatible with SSR (checks for browser environment)
 */

const isBrowser = typeof window !== 'undefined';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rauth_access_token',
  REFRESH_TOKEN: 'rauth_refresh_token',
  SESSION_ID: 'rauth_session_id',
  USER: 'rauth_user',
} as const;

export const storage = {
  /**
   * Get item from localStorage
   */
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  /**
   * Set item in localStorage
   */
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  /**
   * Clear all RAuth data from localStorage
   */
  clear: (): void => {
    if (!isBrowser) return;
    Object.values(STORAGE_KEYS).forEach((key) => {
      storage.removeItem(key);
    });
  },

  // Convenience methods for specific data
  getAccessToken: (): string | null => storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string): void => storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
  removeAccessToken: (): void => storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: (): string | null => storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string): void => storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: (): void => storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),

  getSessionId: (): string | null => storage.getItem(STORAGE_KEYS.SESSION_ID),
  setSessionId: (id: string): void => storage.setItem(STORAGE_KEYS.SESSION_ID, id),
  removeSessionId: (): void => storage.removeItem(STORAGE_KEYS.SESSION_ID),

  getUser: (): string | null => storage.getItem(STORAGE_KEYS.USER),
  setUser: (user: string): void => storage.setItem(STORAGE_KEYS.USER, user),
  removeUser: (): void => storage.removeItem(STORAGE_KEYS.USER),
};

export { STORAGE_KEYS };
