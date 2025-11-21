/**
 * Server actions for Next.js SSR
 * 
 * These functions enable server-side authentication for Next.js applications,
 * supporting both Pages Router (getServerSideProps, API routes) and
 * App Router (Server Components, Server Actions).
 * 
 * All functions are designed to work with cookie-based sessions and
 * gracefully handle errors by returning null instead of throwing,
 * except for the `require*` functions which are designed for protected routes.
 * 
 * @module server/actions
 */

import type { User, Session } from '../utils/types';
import { getSessionFromCookies } from '../utils/storage';
import { getCurrentUser as apiGetCurrentUser } from '../utils/api';

/**
 * Get session from server-side cookie header
 * 
 * This function extracts and validates a session from the cookie header string.
 * It checks if the session exists and is not expired.
 * 
 * Works with:
 * - Next.js Pages Router (getServerSideProps, API routes)
 * - Next.js App Router (when passing cookie header explicitly)
 * 
 * @param cookieHeader - Cookie header string from request (e.g., req.headers.cookie)
 * @returns Session object if valid, null if not found or expired
 * 
 * @example
 * ```typescript
 * // In getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   const session = await getSessionAction(req.headers.cookie);
 *   
 *   if (!session) {
 *     return { redirect: { destination: '/login', permanent: false } };
 *   }
 *   
 *   return { props: { session } };
 * }
 * 
 * // In API route
 * export default async function handler(req, res) {
 *   const session = await getSessionAction(req.headers.cookie);
 *   
 *   if (!session) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 *   
 *   // Use session...
 * }
 * ```
 */
export async function getSessionAction(
  cookieHeader: string | undefined
): Promise<Session | null> {
  try {
    // Get session and user from cookies
    const sessionData = getSessionFromCookies(cookieHeader);

    if (!sessionData) {
      return null;
    }

    return sessionData.session;
  } catch (error) {
    console.error('[RAuth Server] Failed to get session:', error);
    return null;
  }
}

/**
 * Get user from server-side cookie header
 * 
 * This function retrieves user information from cookies. If the user is not
 * in cookies (but session is valid), it can optionally fetch from the backend.
 * 
 * Works with:
 * - Next.js Pages Router (getServerSideProps, API routes)
 * - Next.js App Router (when passing cookie header explicitly)
 * 
 * @param cookieHeader - Cookie header string from request (e.g., req.headers.cookie)
 * @param fetchFromBackend - Whether to fetch from backend if not in cookies (default: false)
 * @returns User object if authenticated, null if not found or session expired
 * 
 * @example
 * ```typescript
 * // In getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   const user = await getUserAction(req.headers.cookie);
 *   
 *   if (!user) {
 *     return { redirect: { destination: '/login', permanent: false } };
 *   }
 *   
 *   return { props: { user } };
 * }
 * 
 * // Fetch from backend if not in cookies
 * const user = await getUserAction(req.headers.cookie, true);
 * ```
 */
export async function getUserAction(
  cookieHeader: string | undefined,
  fetchFromBackend: boolean = false
): Promise<User | null> {
  try {
    // Get session and user from cookies
    const sessionData = getSessionFromCookies(cookieHeader);

    if (!sessionData) {
      return null;
    }

    // Return user from cookies
    if (sessionData.user) {
      return sessionData.user;
    }

    // If user not in cookies but fetchFromBackend is true, try backend
    if (fetchFromBackend && sessionData.session) {
      try {
        const user = await apiGetCurrentUser();
        return user;
      } catch (error) {
        console.error('[RAuth Server] Failed to fetch user from backend:', error);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('[RAuth Server] Failed to get user:', error);
    return null;
  }
}

/**
 * Require session - throws error if session not found or expired
 * 
 * This function is designed for protected routes where authentication is mandatory.
 * Unlike getSessionAction, this function throws an error if the session is invalid,
 * which can be caught and handled (e.g., by redirecting to login).
 * 
 * @param cookieHeader - Cookie header string from request
 * @param errorMessage - Custom error message (optional)
 * @returns Session object (guaranteed to be non-null)
 * @throws Error if session not found or expired
 * 
 * @example
 * ```typescript
 * // In getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   try {
 *     const session = await requireSession(req.headers.cookie);
 *     
 *     // Session is guaranteed to be valid here
 *     return { props: { session } };
 *   } catch (error) {
 *     // Redirect to login
 *     return { redirect: { destination: '/login', permanent: false } };
 *   }
 * }
 * 
 * // In API route
 * export default async function handler(req, res) {
 *   try {
 *     const session = await requireSession(req.headers.cookie);
 *     // Process authenticated request...
 *   } catch (error) {
 *     return res.status(401).json({ error: 'Unauthorized' });
 *   }
 * }
 * ```
 */
export async function requireSession(
  cookieHeader: string | undefined,
  errorMessage: string = 'Authentication required'
): Promise<Session> {
  const session = await getSessionAction(cookieHeader);

  if (!session) {
    throw new Error(errorMessage);
  }

  return session;
}

/**
 * Require user - throws error if user not found or session expired
 * 
 * This function is designed for protected routes where user data is required.
 * It throws an error if the user cannot be retrieved.
 * 
 * @param cookieHeader - Cookie header string from request
 * @param errorMessage - Custom error message (optional)
 * @param fetchFromBackend - Whether to fetch from backend if not in cookies (default: false)
 * @returns User object (guaranteed to be non-null)
 * @throws Error if user not found or session expired
 * 
 * @example
 * ```typescript
 * // In getServerSideProps
 * export async function getServerSideProps({ req }) {
 *   try {
 *     const user = await requireUser(req.headers.cookie);
 *     
 *     // User is guaranteed to be valid here
 *     return { props: { user } };
 *   } catch (error) {
 *     // Redirect to login
 *     return { redirect: { destination: '/login', permanent: false } };
 *   }
 * }
 * ```
 */
export async function requireUser(
  cookieHeader: string | undefined,
  errorMessage: string = 'User authentication required',
  fetchFromBackend: boolean = false
): Promise<User> {
  const user = await getUserAction(cookieHeader, fetchFromBackend);

  if (!user) {
    throw new Error(errorMessage);
  }

  return user;
}

/**
 * Get session from Next.js App Router (Server Components)
 * 
 * This function is specifically for Next.js 13+ App Router Server Components
 * and Server Actions. It uses the `cookies()` function from `next/headers`
 * to read cookies.
 * 
 * Note: This only works in Next.js App Router context. In other environments,
 * it returns null.
 * 
 * @returns Session object if valid, null if not found or not in Next.js context
 * 
 * @example
 * ```typescript
 * // In Server Component
 * export default async function ProfilePage() {
 *   const session = await getSession();
 *   
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   
 *   return <div>Session ID: {session.id}</div>;
 * }
 * 
 * // In Server Action
 * async function updateProfile(formData: FormData) {
 *   'use server';
 *   
 *   const session = await getSession();
 *   if (!session) {
 *     throw new Error('Unauthorized');
 *   }
 *   
 *   // Process form...
 * }
 * ```
 */
export async function getSession(): Promise<Session | null> {
  try {
    // Try to dynamically import cookies from next/headers
    // This will fail gracefully if next/headers is not available
    const nextHeaders = await import('next/headers').catch(() => null);
    
    if (!nextHeaders || !nextHeaders.cookies) {
      return null;
    }
    
    // Get cookie header from Next.js cookies()
    const cookieStore = await nextHeaders.cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    return getSessionAction(cookieHeader);
  } catch (error) {
    // Not in Next.js App Router context or cookies() not available
    return null;
  }
}

/**
 * Get current user from Next.js App Router (Server Components)
 * 
 * This function is specifically for Next.js 13+ App Router Server Components
 * and Server Actions. It uses the `cookies()` function from `next/headers`
 * to read cookies.
 * 
 * Note: This only works in Next.js App Router context. In other environments,
 * it returns null.
 * 
 * @param fetchFromBackend - Whether to fetch from backend if not in cookies (default: false)
 * @returns User object if authenticated, null if not found or not in Next.js context
 * 
 * @example
 * ```typescript
 * // In Server Component
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser();
 *   
 *   if (!user) {
 *     redirect('/login');
 *   }
 *   
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * 
 * // In Server Action
 * async function deleteAccount() {
 *   'use server';
 *   
 *   const user = await getCurrentUser();
 *   if (!user) {
 *     throw new Error('Unauthorized');
 *   }
 *   
 *   // Delete account...
 * }
 * ```
 */
export async function getCurrentUser(
  fetchFromBackend: boolean = false
): Promise<User | null> {
  try {
    // Try to dynamically import cookies from next/headers
    // This will fail gracefully if next/headers is not available
    const nextHeaders = await import('next/headers').catch(() => null);
    
    if (!nextHeaders || !nextHeaders.cookies) {
      return null;
    }
    
    // Get cookie header from Next.js cookies()
    const cookieStore = await nextHeaders.cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    return getUserAction(cookieHeader, fetchFromBackend);
  } catch (error) {
    // Not in Next.js App Router context or cookies() not available
    return null;
  }
}

/**
 * Legacy: Get current user action (alias for getUserAction)
 * 
 * @deprecated Use getUserAction instead
 */
export async function getCurrentUserAction(): Promise<User | null> {
  return getCurrentUser();
}

/**
 * Legacy: Validate session action
 * 
 * @deprecated Use getSessionAction instead and check if result is not null
 */
export async function validateSessionAction(sessionId: string): Promise<boolean> {
  try {
    // Try to get session from cookies
    const session = await getSession();
    
    // Check if session ID matches
    return session?.id === sessionId;
  } catch {
    return false;
  }
}
