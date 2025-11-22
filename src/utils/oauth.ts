/**
 * OAuth Flow utilities
 * 
 * Provides functions for managing the OAuth 2.0 Authorization Code Flow,
 * including state generation, OAuth initiation, callback handling, and
 * CSRF protection.
 */

import { getConfig } from './config';
import { buildUrl, apiRequest } from './api';
import { saveSession } from './storage';
import { decodeJWT } from './jwt';
import type { ProviderName, LoginResponse, User, Session } from './types';
import { API_ENDPOINTS } from './constants';

/**
 * Generate a random state string for CSRF protection
 * 
 * Creates a cryptographically secure random string and saves it
 * to sessionStorage for later validation.
 * 
 * @returns Random state string
 * 
 * @example
 * ```typescript
 * const state = generateState();
 * // state is saved to sessionStorage automatically
 * ```
 */
export function generateState(): string {
  let state: string;

  // Try to use crypto.randomUUID (modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    state = crypto.randomUUID();
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // Fallback to crypto.getRandomValues
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Convert to base64
    state = btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } else {
    // Ultimate fallback (should never happen in modern environments)
    state = Math.random().toString(36).substring(2) + 
            Math.random().toString(36).substring(2);
  }

  // Save to sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('oauth_state', state);
  }

  return state;
}

/**
 * Get the OAuth callback URL
 * 
 * Returns the configured redirectUrl or constructs one from window.location.origin.
 * 
 * @param path - Optional custom path (default: '/auth/callback')
 * @returns Complete callback URL
 * 
 * @example
 * ```typescript
 * const url = getCallbackUrl();
 * // Returns: 'https://app.com/auth/callback'
 * 
 * const customUrl = getCallbackUrl('/custom/callback');
 * // Returns: 'https://app.com/custom/callback'
 * ```
 */
export function getCallbackUrl(path: string = '/auth/callback'): string {
  const config = getConfig();

  // Use configured redirectUrl if available and no custom path provided
  if (config.redirectUrl && path === '/auth/callback') {
    return config.redirectUrl;
  }

  // Construct from window.location.origin + path
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    return `${origin}${path}`;
  }

  // SSR fallback (should not happen in OAuth flow)
  throw new Error('Cannot determine callback URL in SSR context without configured redirectUrl');
}

/**
 * Initiate OAuth authorization flow
 * 
 * Generates a state parameter, constructs the authorization URL,
 * and redirects the browser to the OAuth provider.
 * 
 * @param provider - OAuth provider to use
 * 
 * @example
 * ```typescript
 * // User clicks "Sign in with Google"
 * initiateOAuth('google');
 * // Browser is redirected to OAuth provider
 * ```
 */
export function initiateOAuth(provider: ProviderName): void {
  // Get config for appId
  const config = getConfig();

  // Generate state for CSRF protection
  const state = generateState();

  // Get callback URL
  const redirectUri = getCallbackUrl();

  // Build authorization URL
  const baseUrl = buildUrl(API_ENDPOINTS.OAUTH_AUTHORIZE);
  const params = new URLSearchParams({
    provider,
    app_id: config.appId,
    redirect_uri: redirectUri,
    state,
  });

  const authUrl = `${baseUrl}?${params.toString()}`;

  // Redirect browser
  if (typeof window !== 'undefined') {
    window.location.href = authUrl;
  }
}

/**
 * Validate OAuth state parameter
 * 
 * Compares the received state with the one saved in sessionStorage
 * to prevent CSRF attacks.
 * 
 * @param receivedState - State parameter from OAuth callback
 * @returns true if state is valid, false otherwise
 * 
 * @example
 * ```typescript
 * const params = new URLSearchParams(window.location.search);
 * const state = params.get('state');
 * 
 * if (!validateState(state)) {
 *   throw new Error('CSRF attack detected');
 * }
 * ```
 */
export function validateState(receivedState: string | null): boolean {
  if (!receivedState) {
    return false;
  }

  // Get saved state from sessionStorage
  let savedState: string | null = null;
  
  if (typeof sessionStorage !== 'undefined') {
    savedState = sessionStorage.getItem('oauth_state');
  }

  if (!savedState) {
    return false;
  }

  // Compare states
  const isValid = savedState === receivedState;

  // Remove state from storage on successful validation
  if (isValid && typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('oauth_state');
  }

  return isValid;
}

/**
 * Handle OAuth callback
 * 
 * Processes the OAuth callback by:
 * 1. Parsing URL parameters (code, state, error)
 * 2. Validating state parameter
 * 3. Exchanging authorization code for tokens
 * 4. Saving session and tokens to storage
 * 
 * @param params - URLSearchParams from callback URL
 * @returns Login response with user and session data
 * @throws Error if callback contains error or validation fails
 * 
 * @example
 * ```typescript
 * // On callback page
 * const params = new URLSearchParams(window.location.search);
 * 
 * try {
 *   const result = await handleOAuthCallback(params);
 *   console.log('Logged in as:', result.user.email);
 * } catch (error) {
 *   console.error('OAuth failed:', error);
 * }
 * ```
 */
export async function handleOAuthCallback(params: URLSearchParams): Promise<LoginResponse> {
  // Check for OAuth error
  const error = params.get('error');
  if (error) {
    const errorDescription = params.get('error_description') || error;
    throw new Error(`OAuth error: ${errorDescription}`);
  }

  // Check if backend returned a token directly (simplified flow)
  const token = params.get('token');
  if (token) {
    return handleDirectTokenCallback(token);
  }

  // Get authorization code (standard OAuth flow)
  const code = params.get('code');
  if (!code) {
    throw new Error('Missing authorization code or token in callback');
  }

  // Get and validate state (if present)
  const state = params.get('state');
  if (state && !validateState(state)) {
    throw new Error('CSRF validation failed: Invalid state parameter');
  }

  // Get callback URL for API request
  const redirectUri = getCallbackUrl();

  // Exchange code for tokens
  const loginResponse = await apiRequest<LoginResponse>(
    API_ENDPOINTS.OAUTH_CALLBACK,
    'POST',
    {
      code,
      redirect_uri: redirectUri,
    },
    false // Don't require auth for this request
  );

  // Save session and user to storage
  saveSession(loginResponse.session, loginResponse.user);

  return loginResponse;
}

/**
 * Handle direct token callback (when backend returns JWT directly)
 * @internal
 */
async function handleDirectTokenCallback(token: string): Promise<LoginResponse> {
  // Decode JWT to extract user info
  const payload = decodeJWT(token);
  if (!payload) {
    throw new Error('Invalid token received from OAuth callback');
  }

  // Extract data from JWT payload
  const userId = payload.user_id as string || payload.sub;
  const sessionId = payload.session_id as string || '';
  const email = payload.email as string || '';
  const exp = payload.exp;

  // Create user object from JWT claims
  const user: User = {
    id: userId,
    email: email,
    name: payload.name as string | undefined,
    avatar: payload.avatar as string | undefined,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Create session object
  const session: Session = {
    id: sessionId,
    userId: userId,
    accessToken: token,
    refreshToken: '', // Backend may not provide refresh token in this flow
    expiresAt: exp * 1000, // Convert to milliseconds
    createdAt: new Date().toISOString(),
    provider: 'google', // Default, could be extracted from JWT if available
  };

  // Create login response
  const loginResponse: LoginResponse = {
    user,
    session,
    accessToken: token,
    refreshToken: '',
    expiresAt: exp * 1000,
  };

  // Save session and user to storage
  saveSession(session, user);

  return loginResponse;
}
