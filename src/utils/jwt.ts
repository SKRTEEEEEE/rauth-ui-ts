/**
 * JWT utilities for token validation and decoding
 */

interface JWTPayload {
  sub: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
}

/**
 * Decode a JWT token (without verification)
 * Note: This is for client-side use only. Server-side should verify the signature.
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Check if token expires in the next 60 seconds (buffer for refresh)
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now + 60;
}

/**
 * Get the expiration time of a JWT token
 */
export function getTokenExpiration(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }

  return new Date(payload.exp * 1000);
}

/**
 * Get the subject (user ID) from a JWT token
 */
export function getTokenSubject(token: string): string | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.sub) {
    return null;
  }

  return payload.sub;
}
