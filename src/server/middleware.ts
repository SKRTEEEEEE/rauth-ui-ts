/**
 * Middleware for Next.js authentication
 * 
 * This module provides utilities to create authentication middleware for Next.js
 * applications, enabling automatic route protection, session validation, and
 * redirects to login pages.
 * 
 * @module server/middleware
 */

import type { NextRequest, NextMiddleware } from 'next/server';
import { getSessionFromCookies } from '../utils/storage';

/**
 * Configuration options for the authentication middleware
 * 
 * @property protectedPaths - Array of path patterns that require authentication
 * @property publicPaths - Array of path patterns that are publicly accessible
 * @property loginPath - Path to redirect to when authentication is required
 * @property requireAuth - If true, all paths require auth unless in publicPaths (default: false)
 */
export interface AuthMiddlewareOptions {
  /**
   * Array of path patterns that require authentication.
   * Supports exact matches and wildcards (e.g., '/dashboard/*')
   * 
   * @default ['/dashboard', '/profile']
   * @example
   * ```typescript
   * protectedPaths: ['/dashboard/*', '/profile', '/settings/*']
   * ```
   */
  protectedPaths?: string[];

  /**
   * Array of path patterns that are publicly accessible without authentication.
   * Supports exact matches and wildcards (e.g., '/blog/*')
   * 
   * @default ['/', '/login', '/api']
   * @example
   * ```typescript
   * publicPaths: ['/', '/login', '/signup', '/about', '/api/*']
   * ```
   */
  publicPaths?: string[];

  /**
   * Path to redirect to when authentication is required.
   * The original path will be preserved as a query parameter.
   * 
   * @default '/login'
   * @example
   * ```typescript
   * loginPath: '/signin'
   * // Redirects to: /signin?redirect=/dashboard
   * ```
   */
  loginPath?: string;

  /**
   * If true, all paths require authentication unless explicitly listed in publicPaths.
   * If false, only paths in protectedPaths require authentication.
   * 
   * @default false
   * @example
   * ```typescript
   * requireAuth: true,
   * publicPaths: ['/', '/about']
   * // Only / and /about are accessible without auth
   * ```
   */
  requireAuth?: boolean;
}

/**
 * Check if a pathname matches a path pattern
 * 
 * Supports:
 * - Exact matches: '/dashboard' matches only '/dashboard'
 * - Wildcard matches: '/dashboard/*' matches '/dashboard/settings', '/dashboard/a/b/c'
 * - Trailing slashes are normalized
 * 
 * @param pathname - The pathname to check (from request.nextUrl.pathname)
 * @param pattern - The pattern to match against
 * @returns True if the pathname matches the pattern
 * 
 * @example
 * ```typescript
 * isPathMatch('/dashboard', '/dashboard')        // true
 * isPathMatch('/dashboard/settings', '/dashboard/*') // true
 * isPathMatch('/about', '/dashboard')            // false
 * isPathMatch('/dashboard/', '/dashboard')       // true (trailing slash normalized)
 * ```
 */
export function isPathMatch(pathname: string, pattern: string): boolean {
  // Normalize paths (remove trailing slashes)
  const normalizedPath = pathname.replace(/\/$/, '') || '/';
  const normalizedPattern = pattern.replace(/\/$/, '') || '/';

  // Exact match
  if (normalizedPath === normalizedPattern) {
    return true;
  }

  // Wildcard match: '/dashboard/*' matches '/dashboard/anything'
  if (normalizedPattern.endsWith('/*')) {
    const basePattern = normalizedPattern.slice(0, -2); // Remove '/*'
    return (
      normalizedPath === basePattern ||
      normalizedPath.startsWith(basePattern + '/')
    );
  }

  return false;
}

/**
 * Check if a pathname matches any pattern in an array
 * 
 * @param pathname - The pathname to check
 * @param patterns - Array of patterns to check against
 * @returns True if the pathname matches any pattern
 * 
 * @example
 * ```typescript
 * matchesAnyPattern('/dashboard/settings', ['/dashboard/*', '/profile'])
 * // true
 * ```
 */
export function matchesAnyPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => isPathMatch(pathname, pattern));
}

/**
 * Check if request has valid authentication
 * 
 * Reads session from request cookies and validates it's not expired.
 * This is a lightweight check suitable for Edge runtime.
 * 
 * @param request - Next.js request object
 * @returns True if the request has a valid, non-expired session
 * 
 * @example
 * ```typescript
 * if (await isAuthenticated(request)) {
 *   // User is authenticated
 * } else {
 *   // User is not authenticated
 * }
 * ```
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Get cookies from request
    const cookieHeader = request.cookies
      .getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Get session from cookies
    const sessionData = getSessionFromCookies(cookieHeader);

    // Check if session exists and is not expired
    if (!sessionData || !sessionData.session) {
      return false;
    }

    // Check expiration
    const now = Date.now();
    if (sessionData.session.expiresAt <= now) {
      return false;
    }

    return true;
  } catch (error) {
    // On error, consider not authenticated
    console.error('[RAuth Middleware] Failed to check authentication:', error);
    return false;
  }
}

/**
 * Create authentication middleware for Next.js
 * 
 * This factory function creates a Next.js middleware that:
 * 1. Checks if the requested path requires authentication
 * 2. Validates the user's session from cookies
 * 3. Redirects to login if authentication is required but missing
 * 4. Preserves the original URL for post-login redirect
 * 
 * The middleware is designed to be lightweight and run on Edge runtime,
 * avoiding heavy operations or external API calls.
 * 
 * @param options - Configuration options for the middleware
 * @returns Next.js middleware function
 * 
 * @example
 * ```typescript
 * // In middleware.ts at the root of your Next.js project
 * import { createAuthMiddleware } from 'rauth/server';
 * 
 * export const middleware = createAuthMiddleware({
 *   protectedPaths: ['/dashboard/*', '/profile'],
 *   publicPaths: ['/', '/login', '/signup', '/about'],
 *   loginPath: '/login'
 * });
 * 
 * export const config = {
 *   matcher: ['/dashboard/:path*', '/profile']
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Protect all routes except public ones
 * export const middleware = createAuthMiddleware({
 *   requireAuth: true,
 *   publicPaths: ['/', '/login', '/signup', '/about'],
 *   loginPath: '/login'
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Custom login path
 * export const middleware = createAuthMiddleware({
 *   protectedPaths: ['/admin/*'],
 *   loginPath: '/auth/signin'
 * });
 * // Redirects to: /auth/signin?redirect=/admin/users
 * ```
 */
export function createAuthMiddleware(
  options: AuthMiddlewareOptions = {}
): NextMiddleware {
  const {
    protectedPaths = ['/dashboard', '/profile'],
    publicPaths = ['/', '/login', '/api'],
    loginPath = '/login',
    requireAuth = false
  } = options;

  return async function authMiddleware(request: NextRequest) {
    try {
      // Get pathname from request
      const { pathname } = request.nextUrl;

      // Check if path is public (always allowed)
      if (matchesAnyPattern(pathname, publicPaths)) {
        return; // Allow request to continue
      }

      // Determine if this path requires authentication
      let needsAuth = false;
      
      if (requireAuth) {
        // If requireAuth is true, all paths need auth unless in publicPaths
        needsAuth = true;
      } else {
        // If requireAuth is false, only protectedPaths need auth
        needsAuth = matchesAnyPattern(pathname, protectedPaths);
      }

      // If this path doesn't need auth, allow it
      if (!needsAuth) {
        return; // Allow request to continue
      }

      // Check if user is authenticated
      const authenticated = await isAuthenticated(request);

      if (!authenticated) {
        // User is not authenticated, redirect to login
        // Preserve the original URL for post-login redirect
        const redirectUrl = new URL(loginPath, request.url);
        
        // Don't create a redirect loop if already on login path
        if (pathname === loginPath) {
          return; // Allow access to login page
        }

        // Add return URL as query parameter (encode to handle special chars)
        redirectUrl.searchParams.set('redirect', pathname + request.nextUrl.search + request.nextUrl.hash);

        // Dynamically import NextResponse (might not be available outside Next.js)
        const { NextResponse } = await import('next/server');
        return NextResponse.redirect(redirectUrl);
      }

      // User is authenticated, allow request to continue
      return; // or return NextResponse.next()
    } catch (error) {
      // On error, log and allow request (fail open for availability)
      console.error('[RAuth Middleware] Middleware error:', error);
      
      // In production, you might want to redirect to an error page
      // For now, allow the request to continue to avoid breaking the site
      return;
    }
  };
}

/**
 * Legacy authentication middleware (deprecated)
 * 
 * @deprecated Use createAuthMiddleware instead
 * 
 * @example
 * ```typescript
 * // Old way (deprecated)
 * export const middleware = authMiddleware;
 * 
 * // New way (recommended)
 * export const middleware = createAuthMiddleware({
 *   protectedPaths: ['/dashboard/*'],
 *   publicPaths: ['/'],
 *   loginPath: '/login'
 * });
 * ```
 */
export async function authMiddleware(request: NextRequest) {
  // Use default configuration
  const defaultMiddleware = createAuthMiddleware();
  return defaultMiddleware(request);
}
