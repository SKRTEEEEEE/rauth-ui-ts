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
 * Check if code is running in a server environment (Node.js/SSR)
 * 
 * @returns true if window is undefined (server-side), false otherwise (client)
 * 
 * @example
 * ```typescript
 * if (isServer()) {
 *   // Safe to use Node.js APIs, req.headers, etc.
 * }
 * ```
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
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
 * Set a cookie (unified client/server wrapper)
 * 
 * On client: Sets cookie using document.cookie
 * On server: Returns Set-Cookie header string
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param value - Value to store (will be JSON serialized)
 * @param options - Cookie options
 * @returns void on client, Set-Cookie header string on server
 * 
 * @example
 * ```typescript
 * // Client-side
 * setCookie('session_id', '123', {
 *   path: '/',
 *   secure: true,
 *   sameSite: 'lax',
 *   maxAge: 3600
 * });
 * 
 * // Server-side
 * const cookieHeader = setCookie('session_id', '123', { httpOnly: true });
 * res.setHeader('Set-Cookie', cookieHeader);
 * ```
 */
export function setCookie(
  key: string, 
  value: unknown, 
  options: CookieOptions = {}
): void | string {
  // Server-side: return Set-Cookie header string
  if (isServer()) {
    return setCookieServer(key, value, options);
  }

  // Client-side: set using document.cookie
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
 * Get a cookie value (unified client/server wrapper)
 * 
 * On client: Reads from document.cookie
 * On server: Parses from provided cookieHeader
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param cookieHeader - Optional cookie header string (for server-side use)
 * @returns Parsed value or null if not found
 * 
 * @example
 * ```typescript
 * // Client-side
 * const sessionId = getCookie('session_id');
 * 
 * // Server-side (Next.js)
 * export async function getServerSideProps({ req }) {
 *   const sessionId = getCookie('session_id', req.headers.cookie);
 *   return { props: { sessionId } };
 * }
 * ```
 */
export function getCookie<T = unknown>(
  key: string,
  cookieHeader?: string
): T | null {
  // Server-side or explicit cookieHeader provided
  if (isServer() || cookieHeader !== undefined) {
    return getCookieServer<T>(key, cookieHeader);
  }

  // Client-side: read from document.cookie
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
 * Parse cookie header string into key-value object
 * 
 * Server-side helper to parse the Cookie header from HTTP requests.
 * 
 * @param cookieHeader - Cookie header string (format: "key1=value1; key2=value2")
 * @returns Object with cookie key-value pairs
 * 
 * @example
 * ```typescript
 * const cookies = parseCookies(req.headers.cookie);
 * // { session: 'abc123', user: 'xyz789' }
 * ```
 */
export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  try {
    const cookies: Record<string, string> = {};
    
    const cookiePairs = cookieHeader.split(';');
    
    for (const pair of cookiePairs) {
      const trimmedPair = pair.trim();
      
      if (!trimmedPair) continue;
      
      const equalIndex = trimmedPair.indexOf('=');
      
      if (equalIndex === -1) continue; // Skip malformed cookies
      
      const name = trimmedPair.substring(0, equalIndex);
      const value = trimmedPair.substring(equalIndex + 1);
      
      if (!name) continue; // Skip empty names
      
      try {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      } catch {
        // Skip cookies that can't be decoded
        continue;
      }
    }
    
    return cookies;
  } catch (error) {
    console.error('[RAuth Storage] Failed to parse cookies:', error);
    return {};
  }
}

/**
 * Get a cookie value from server-side cookie header
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param cookieHeader - Cookie header string from request
 * @returns Parsed value or null if not found
 * 
 * @example
 * ```typescript
 * // In Next.js getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   const sessionId = getCookieServer('session', req.headers.cookie);
 *   return { props: { sessionId } };
 * }
 * ```
 */
export function getCookieServer<T = unknown>(
  key: string,
  cookieHeader: string | undefined
): T | null {
  if (!cookieHeader) return null;

  try {
    const prefixedKey = getPrefixedKey(key);
    const cookies = parseCookies(cookieHeader);
    
    const value = cookies[prefixedKey];
    
    if (!value || value === '' || value === '""') return null;
    
    return deserialize(value) as T | null;
  } catch (error) {
    console.error('[RAuth Storage] Failed to get cookie from server:', error);
    return null;
  }
}

/**
 * Generate Set-Cookie header string for server-side cookie setting
 * 
 * Server-side helper to create Set-Cookie header strings.
 * The returned string should be set in response headers.
 * 
 * @param key - Cookie name (will be prefixed automatically)
 * @param value - Value to store (will be JSON serialized)
 * @param options - Cookie options
 * @returns Set-Cookie header string
 * 
 * @example
 * ```typescript
 * // In Next.js API route
 * export default function handler(req, res) {
 *   const cookieString = setCookieServer('session', sessionData, {
 *     httpOnly: true,
 *     secure: true,
 *     sameSite: 'lax',
 *     maxAge: 3600
 *   });
 *   res.setHeader('Set-Cookie', cookieString);
 * }
 * ```
 */
export function setCookieServer(
  key: string,
  value: unknown,
  options: CookieOptions = {}
): string {
  try {
    const prefixedKey = getPrefixedKey(key);
    const serialized = serialize(value);
    
    if (serialized === null) {
      // Fallback to empty string if serialization fails
      return `${encodeURIComponent(prefixedKey)}=; Max-Age=0`;
    }

    // Build Set-Cookie header string
    let cookieStr = `${encodeURIComponent(prefixedKey)}=${encodeURIComponent(serialized)}`;

    // Get default options from config
    let defaultOptions: CookieOptions = {};
    try {
      const config = getConfig();
      defaultOptions = config.storage?.cookieOptions || {};
    } catch {
      // Config not initialized, use empty defaults
    }

    // Merge options (explicit options override defaults)
    const mergedOptions = { ...defaultOptions, ...options };

    // Add cookie attributes
    if (mergedOptions.maxAge !== undefined) {
      cookieStr += `; Max-Age=${mergedOptions.maxAge}`;
    }

    if (mergedOptions.path !== undefined) {
      cookieStr += `; Path=${mergedOptions.path}`;
    }

    if (mergedOptions.domain !== undefined) {
      cookieStr += `; Domain=${mergedOptions.domain}`;
    }

    if (mergedOptions.secure !== undefined && mergedOptions.secure) {
      cookieStr += '; Secure';
    } else if (process.env.NODE_ENV === 'production') {
      // Force secure in production
      cookieStr += '; Secure';
    }

    if (mergedOptions.sameSite !== undefined) {
      // Capitalize first letter for proper Set-Cookie format
      const sameSite = mergedOptions.sameSite.charAt(0).toUpperCase() + 
                       mergedOptions.sameSite.slice(1).toLowerCase();
      cookieStr += `; SameSite=${sameSite}`;
    }

    if (mergedOptions.httpOnly !== undefined && mergedOptions.httpOnly) {
      cookieStr += '; HttpOnly';
    }

    return cookieStr;
  } catch (error) {
    console.error('[RAuth Storage] Failed to set cookie on server:', error);
    return '';
  }
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
 * Get session and user data from cookies (SSR helper)
 * 
 * Server-side helper to extract and validate session from cookie headers.
 * Useful for Next.js getServerSideProps, Server Components, and API routes.
 * 
 * @param cookieHeader - Cookie header string from request
 * @returns Session and user data, or null if not found/invalid/expired
 * 
 * @example
 * ```typescript
 * // Next.js getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   const sessionData = getSessionFromCookies(req.headers.cookie);
 *   
 *   if (!sessionData) {
 *     return { redirect: { destination: '/login', permanent: false } };
 *   }
 *   
 *   return { props: { user: sessionData.user } };
 * }
 * 
 * // Next.js API route
 * export default function handler(req, res) {
 *   const sessionData = getSessionFromCookies(req.headers.cookie);
 *   
 *   if (!sessionData) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 *   
 *   // Use sessionData.user and sessionData.session
 * }
 * ```
 */
export function getSessionFromCookies(
  cookieHeader: string | undefined
): { session: Session; user: User } | null {
  if (!cookieHeader) return null;

  try {
    // Get session from cookies
    const session = getCookieServer<Session>('session', cookieHeader);
    if (!session) return null;

    // Get user from cookies
    const user = getCookieServer<User>('user', cookieHeader);
    if (!user) return null;

    // Check if session is expired
    const now = Date.now();
    if (session.expiresAt <= now) {
      // Session expired
      return null;
    }

    return { session, user };
  } catch (error) {
    console.error('[RAuth Storage] Failed to get session from cookies:', error);
    return null;
  }
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
