/**
 * Storage utilities for RAuth SDK
 * 
 * Provides SSR-safe storage functionality for tokens and session data.
 * Supports localStorage, sessionStorage, and cookies with automatic
 * serialization and prefix handling.
 */

import { getConfig } from './config';
import type { User, Session, CookieOptions } from './types';

// Re-export STORAGE_KEYS for backward compatibility
export { STORAGE_KEYS } from './constants';

/**
 * Check if code is running in a client environment (browser)
 * 
 * @returns true if window is defined (client-side), false otherwise (SSR)
 * 
 * @example
 * ```typescript
 * if (isClient()) {
 *   // Safe to access window, localStorage, etc.
 * }
 * ```
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the storage prefix from config
 * 
 * @returns Storage prefix string
 * @internal
 */
function getPrefix(): string {
  try {
    const config = getConfig();
    return config.storage?.prefix || 'rauth_';
  } catch {
    // If config not initialized, use default
    return 'rauth_';
  }
}

/**
 * Get prefixed key
 * 
 * @param key - Key to prefix
 * @returns Prefixed key
 * @internal
 */
function getPrefixedKey(key: string): string {
  const prefix = getPrefix();
  return `${prefix}${key}`;
}

/**
 * Serialize value to JSON string
 * 
 * @param value - Value to serialize
 * @returns JSON string or null
 * @internal
 */
function serialize(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('[RAuth Storage] Failed to serialize value:', error);
    return null;
  }
}

/**
 * Deserialize JSON string to value
 * 
 * @param str - JSON string to deserialize
 * @returns Parsed value or null
 * @internal
 */
function deserialize(str: string | null): unknown {
  if (!str) return null;
  
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('[RAuth Storage] Failed to deserialize value:', error);
    return null;
  }
}

/**
 * Set an item in localStorage
 * 
 * @param key - Storage key (will be prefixed automatically)
 * @param value - Value to store (will be JSON serialized)
 * 
 * @example
 * ```typescript
 * setItem('user_id', '123');
 * setItem('user_data', { id: '123', email: 'test@example.com' });
 * ```
 */
export function setItem(key: string, value: unknown): void {
  if (!isClient()) return;

  try {
    const prefixedKey = getPrefixedKey(key);
    const serialized = serialize(value);
    
    if (serialized === null) return;
    
    localStorage.setItem(prefixedKey, serialized);
  } catch (error) {
    // Handle QuotaExceededError and other errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('[RAuth Storage] localStorage quota exceeded. Consider using cookies or clearing old data.');
    } else {
      console.error('[RAuth Storage] Failed to set item:', error);
    }
  }
}

/**
 * Get an item from localStorage
 * 
 * @param key - Storage key (will be prefixed automatically)
 * @returns Parsed value or null if not found
 * 
 * @example
 * ```typescript
 * const userId = getItem('user_id');
 * const userData = getItem('user_data');
 * ```
 */
export function getItem<T = unknown>(key: string): T | null {
  if (!isClient()) return null;

  try {
    const prefixedKey = getPrefixedKey(key);
    const value = localStorage.getItem(prefixedKey);
    return deserialize(value) as T | null;
  } catch (error) {
    console.error('[RAuth Storage] Failed to get item:', error);
    return null;
  }
}

/**
 * Remove an item from localStorage
 * 
 * @param key - Storage key (will be prefixed automatically)
 * 
 * @example
 * ```typescript
 * removeItem('user_id');
 * ```
 */
export function removeItem(key: string): void {
  if (!isClient()) return;

  try {
    const prefixedKey = getPrefixedKey(key);
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error('[RAuth Storage] Failed to remove item:', error);
  }
}

/**
 * Clear all items with the configured prefix from localStorage
 * 
 * @example
 * ```typescript
 * clear(); // Removes all RAuth items but leaves other app data
 * ```
 */
export function clear(): void {
  if (!isClient()) return;

  try {
    const prefix = getPrefix();
    const keysToRemove: string[] = [];
    
    // Collect keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove collected keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[RAuth Storage] Failed to clear storage:', error);
  }
}

/**
 * Set a cookie
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param value - Value to store (will be JSON serialized)
 * @param options - Cookie options
 * 
 * @example
 * ```typescript
 * setCookie('session_id', '123', {
 *   path: '/',
 *   secure: true,
 *   sameSite: 'lax',
 *   maxAge: 3600
 * });
 * ```
 */
export function setCookie(key: string, value: unknown, options: CookieOptions = {}): void {
  if (!isClient()) return;

  try {
    const prefixedKey = getPrefixedKey(key);
    const serialized = serialize(value);
    
    if (serialized === null) return;

    // Build cookie string
    let cookieStr = `${encodeURIComponent(prefixedKey)}=${encodeURIComponent(serialized)}`;

    // Add options
    if (options.maxAge !== undefined) {
      cookieStr += `; max-age=${options.maxAge}`;
    }

    if (options.path !== undefined) {
      cookieStr += `; path=${options.path}`;
    }

    if (options.domain !== undefined) {
      cookieStr += `; domain=${options.domain}`;
    }

    if (options.secure !== undefined && options.secure) {
      cookieStr += '; secure';
    }

    if (options.sameSite !== undefined) {
      cookieStr += `; samesite=${options.sameSite}`;
    }

    document.cookie = cookieStr;
  } catch (error) {
    console.error('[RAuth Storage] Failed to set cookie:', error);
  }
}

/**
 * Get a cookie value
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @returns Parsed value or null if not found
 * 
 * @example
 * ```typescript
 * const sessionId = getCookie('session_id');
 * ```
 */
export function getCookie<T = unknown>(key: string): T | null {
  if (!isClient()) return null;

  try {
    const prefixedKey = getPrefixedKey(key);
    const encodedKey = encodeURIComponent(prefixedKey);
    
    // Parse document.cookie
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const [cookieName, ...cookieValueParts] = cookie.split('=');
      
      if (!cookieName) continue;
      
      const trimmedName = cookieName.trim();
      
      if (trimmedName === encodedKey) {
        const cookieValue = cookieValueParts.join('=');
        const decodedValue = decodeURIComponent(cookieValue);
        
        // Check for empty string (cookie was removed)
        if (decodedValue === '' || decodedValue === '""') {
          return null;
        }
        
        return deserialize(decodedValue) as T | null;
      }
    }

    return null;
  } catch (error) {
    console.error('[RAuth Storage] Failed to get cookie:', error);
    return null;
  }
}

/**
 * Remove a cookie
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param options - Cookie options (should match the options used when setting)
 * 
 * @example
 * ```typescript
 * removeCookie('session_id', { path: '/' });
 * ```
 */
export function removeCookie(key: string, options: CookieOptions = {}): void {
  // Set cookie with maxAge=0 to delete it
  setCookie(key, '', { ...options, maxAge: 0 });
}

/**
 * Storage adapter interface
 * Provides unified API for different storage backends
 */
export interface StorageAdapter {
  get<T = unknown>(key: string): T | null;
  set(key: string, value: unknown): void;
  remove(key: string): void;
  clear(): void;
}

/**
 * Create a storage adapter based on config
 * 
 * @returns Storage adapter instance
 * 
 * @example
 * ```typescript
 * const storage = createStorageAdapter();
 * storage.set('key', 'value');
 * const value = storage.get('key');
 * ```
 */
export function createStorageAdapter(): StorageAdapter {
  let storageType: 'localStorage' | 'sessionStorage' | 'cookies' = 'localStorage';

  try {
    const config = getConfig();
    storageType = config.storage?.type || 'localStorage';
  } catch {
    // If config not initialized, use default localStorage
    storageType = 'localStorage';
  }

  if (storageType === 'sessionStorage') {
    return createSessionStorageAdapter();
  } else if (storageType === 'cookies') {
    return createCookieAdapter();
  } else {
    return createLocalStorageAdapter();
  }
}

/**
 * Create localStorage adapter
 * @internal
 */
function createLocalStorageAdapter(): StorageAdapter {
  return {
    get<T = unknown>(key: string): T | null {
      return getItem<T>(key);
    },
    set(key: string, value: unknown): void {
      setItem(key, value);
    },
    remove(key: string): void {
      removeItem(key);
    },
    clear(): void {
      clear();
    },
  };
}

/**
 * Create sessionStorage adapter
 * @internal
 */
function createSessionStorageAdapter(): StorageAdapter {
  return {
    get<T = unknown>(key: string): T | null {
      if (!isClient()) return null;

      try {
        const prefixedKey = getPrefixedKey(key);
        const value = sessionStorage.getItem(prefixedKey);
        return deserialize(value) as T | null;
      } catch (error) {
        console.error('[RAuth Storage] Failed to get from sessionStorage:', error);
        return null;
      }
    },
    set(key: string, value: unknown): void {
      if (!isClient()) return;

      try {
        const prefixedKey = getPrefixedKey(key);
        const serialized = serialize(value);
        
        if (serialized === null) return;
        
        sessionStorage.setItem(prefixedKey, serialized);
      } catch (error) {
        console.error('[RAuth Storage] Failed to set in sessionStorage:', error);
      }
    },
    remove(key: string): void {
      if (!isClient()) return;

      try {
        const prefixedKey = getPrefixedKey(key);
        sessionStorage.removeItem(prefixedKey);
      } catch (error) {
        console.error('[RAuth Storage] Failed to remove from sessionStorage:', error);
      }
    },
    clear(): void {
      if (!isClient()) return;

      try {
        const prefix = getPrefix();
        const keysToRemove: string[] = [];
        
        // Collect keys to remove
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keysToRemove.push(key);
          }
        }
        
        // Remove collected keys
        keysToRemove.forEach(key => {
          sessionStorage.removeItem(key);
        });
      } catch (error) {
        console.error('[RAuth Storage] Failed to clear sessionStorage:', error);
      }
    },
  };
}

/**
 * Create cookie adapter
 * @internal
 */
function createCookieAdapter(): StorageAdapter {
  let cookieOptions = {};

  try {
    const config = getConfig();
    cookieOptions = config.storage?.cookieOptions || {};
  } catch {
    // If config not initialized, use empty options
    cookieOptions = {};
  }

  return {
    get<T = unknown>(key: string): T | null {
      return getCookie<T>(key);
    },
    set(key: string, value: unknown): void {
      setCookie(key, value, cookieOptions);
    },
    remove(key: string): void {
      removeCookie(key, cookieOptions);
    },
    clear(): void {
      if (!isClient()) return;

      try {
        const prefix = getPrefix();
        const cookies = document.cookie.split(';');
        
        cookies.forEach(cookie => {
          const [cookieName] = cookie.split('=');
          
          if (!cookieName) return;
          
          const trimmedName = decodeURIComponent(cookieName.trim());
          
          if (trimmedName.startsWith(prefix)) {
            // Extract original key by removing prefix
            const originalKey = trimmedName.substring(prefix.length);
            removeCookie(originalKey, cookieOptions);
          }
        });
      } catch (error) {
        console.error('[RAuth Storage] Failed to clear cookies:', error);
      }
    },
  };
}

/**
 * Save session and user data to storage
 * 
 * @param session - Session object to save
 * @param user - User object to save
 * 
 * @example
 * ```typescript
 * saveSession(sessionData, userData);
 * ```
 */
export function saveSession(session: Session, user: User): void {
  const adapter = createStorageAdapter();

  // Save session
  adapter.set('session', session);

  // Save user
  adapter.set('user', user);

  // Save tokens separately for easy access
  adapter.set('access_token', session.accessToken);
  adapter.set('refresh_token', session.refreshToken);

  // Save expiration
  adapter.set('expires_at', session.expiresAt);
}

/**
 * Get session data from storage
 * 
 * @returns Session and user data, or null if not found or expired
 * 
 * @example
 * ```typescript
 * const sessionData = getSession();
 * if (sessionData) {
 *   console.log('Logged in as:', sessionData.user.email);
 * }
 * ```
 */
export function getSession(): { session: Session; user: User } | null {
  const adapter = createStorageAdapter();

  try {
    // Get session
    const session = adapter.get<Session>('session');
    if (!session) return null;

    // Get user
    const user = adapter.get<User>('user');
    if (!user) return null;

    // Check if session is expired
    const now = Date.now();
    if (session.expiresAt <= now) {
      // Session expired, clear it
      clearSession();
      return null;
    }

    return { session, user };
  } catch (error) {
    console.error('[RAuth Storage] Failed to get session:', error);
    return null;
  }
}

/**
 * Clear all session data from storage
 * 
 * @example
 * ```typescript
 * clearSession(); // User is logged out
 * ```
 */
export function clearSession(): void {
  const adapter = createStorageAdapter();

  // Remove all session-related items
  adapter.remove('session');
  adapter.remove('user');
  adapter.remove('access_token');
  adapter.remove('refresh_token');
  adapter.remove('expires_at');
}

/**
 * Legacy storage API for backward compatibility
 * Provides direct access to specific storage keys
 */
export const storage = {
  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return getItem<string>('access_token');
  },

  /**
   * Set access token in storage
   */
  setAccessToken(token: string): void {
    setItem('access_token', token);
  },

  /**
   * Remove access token from storage
   */
  removeAccessToken(): void {
    removeItem('access_token');
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return getItem<string>('refresh_token');
  },

  /**
   * Set refresh token in storage
   */
  setRefreshToken(token: string): void {
    setItem('refresh_token', token);
  },

  /**
   * Remove refresh token from storage
   */
  removeRefreshToken(): void {
    removeItem('refresh_token');
  },

  /**
   * Get session ID from storage
   */
  getSessionId(): string | null {
    const session = getItem<Session>('session');
    return session?.id || null;
  },

  /**
   * Set session ID in storage (legacy - use saveSession instead)
   */
  setSessionId(id: string): void {
    const session = getItem<Session>('session');
    if (session) {
      setItem('session', { ...session, id });
    } else {
      // For backwards compatibility, create a minimal session
      setItem('session', { id } as Partial<Session>);
    }
  },

  /**
   * Remove session ID from storage
   */
  removeSessionId(): void {
    removeItem('session');
  },

  /**
   * Get user data from storage
   */
  getUser(): User | null {
    return getItem<User>('user');
  },

  /**
   * Set user data in storage
   */
  setUser(user: User | string): void {
    // Handle string input for backward compatibility
    if (typeof user === 'string') {
      try {
        const parsed = JSON.parse(user);
        setItem('user', parsed);
      } catch {
        // If it's not valid JSON, store as-is
        setItem('user', user);
      }
    } else {
      setItem('user', user);
    }
  },

  /**
   * Remove user data from storage
   */
  removeUser(): void {
    removeItem('user');
  },

  /**
   * Clear all storage
   */
  clear(): void {
    clearSession();
  },
};
