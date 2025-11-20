/**
 * JWT utilities for token validation and decoding
 * 
 * IMPORTANT: These utilities only decode and read JWT tokens.
 * They DO NOT verify the signature - signature verification must be done on the backend.
 * This is safe for client-side use to extract user information and check expiration.
 */

/**
 * JWT Payload interface representing standard and custom claims
 */
export interface JWTPayload {
  /** Subject - typically the user ID */
  sub: string;
  /** Expiration time (Unix timestamp in seconds) */
  exp: number;
  /** Issued at (Unix timestamp in seconds) */
  iat: number;
  /** Not before (Unix timestamp in seconds) - optional */
  nbf?: number;
  /** Audience - optional */
  aud?: string;
  /** Issuer - optional */
  iss?: string;
  /** JWT ID - optional */
  jti?: string;
  /** Allow any other custom claims */
  [key: string]: unknown;
}

/**
 * Decode a base64url encoded string
 * SSR-safe: Works in both browser (atob) and Node.js (Buffer) environments
 * 
 * @param str - Base64url encoded string
 * @returns Decoded string
 */
function base64UrlDecode(str: string): string {
  // Replace base64url chars with standard base64 chars
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if necessary
  const padding = base64.length % 4;
  if (padding > 0) {
    base64 += '='.repeat(4 - padding);
  }

  // Check if we're in a browser or Node.js environment
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    // Browser environment
    return atob(base64);
  } else if (typeof Buffer !== 'undefined') {
    // Node.js environment (SSR)
    return Buffer.from(base64, 'base64').toString('utf-8');
  } else {
    // Fallback - should never happen in normal environments
    throw new Error('No base64 decoding method available');
  }
}

/**
 * Decode a JWT token without verifying the signature
 * 
 * SECURITY NOTE: This function only decodes the JWT payload.
 * It does NOT verify the signature. Backend must verify token authenticity.
 * Use this only for reading token data on the client side.
 * 
 * @param token - JWT token string (format: header.payload.signature)
 * @returns Decoded payload object or null if token is invalid
 * 
 * @example
 * const token = "eyJhbGc...";
 * const payload = decodeJWT(token);
 * if (payload) {
 *   console.log('User ID:', payload.sub);
 *   console.log('Email:', payload.email);
 * }
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // Validate token format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Extract payload (second part)
    const payload = parts[1];
    if (!payload) {
      return null;
    }
    
    // Decode base64url payload
    const decodedStr = base64UrlDecode(payload);
    
    // Parse JSON
    const decoded = JSON.parse(decodedStr);
    
    return decoded as JWTPayload;
  } catch (error) {
    // Token is malformed or not valid JSON
    // Return null instead of throwing to allow graceful error handling
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * 
 * Includes a 60-second buffer to allow for proactive token refresh.
 * If token expires within 60 seconds, it's considered expired.
 * 
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false if still valid
 * 
 * @example
 * if (isTokenExpired(token)) {
 *   // Refresh token or redirect to login
 *   await refreshToken();
 * }
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    // Treat invalid tokens or tokens without expiration as expired (safe default)
    return true;
  }

  // Check if token expires in the next 60 seconds (buffer for refresh)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + 60;
}

/**
 * Get the expiration time of a JWT token as a Date object
 * 
 * @param token - JWT token string
 * @returns Date object representing expiration time, or null if token is invalid
 * 
 * @example
 * const expiration = getTokenExpiration(token);
 * if (expiration) {
 *   console.log('Token expires at:', expiration.toLocaleString());
 *   console.log('Time until expiration:', expiration.getTime() - Date.now(), 'ms');
 * }
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  // Convert Unix timestamp (seconds) to JavaScript timestamp (milliseconds)
  return new Date(payload.exp * 1000);
}

/**
 * Get the subject (user ID) from a JWT token
 * 
 * @param token - JWT token string
 * @returns User ID (subject) or null if token is invalid or missing subject
 * 
 * @example
 * const userId = getTokenSubject(token);
 * if (userId) {
 *   console.log('Current user:', userId);
 * }
 */
export function getTokenSubject(token: string): string | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.sub) {
    return null;
  }

  return payload.sub;
}

/**
 * Get a specific claim from a JWT token
 * 
 * @param token - JWT token string
 * @param claimKey - The key of the claim to extract
 * @returns The claim value or null if token is invalid or claim doesn't exist
 * 
 * @example
 * const email = getTokenClaim(token, 'email');
 * const role = getTokenClaim(token, 'role');
 * const permissions = getTokenClaim(token, 'permissions');
 */
export function getTokenClaim<T = unknown>(token: string, claimKey: string): T | null {
  const payload = decodeJWT(token);
  if (!payload) {
    return null;
  }

  const claim = payload[claimKey];
  return claim !== undefined ? (claim as T) : null;
}
