/**
 * RAuth SDK - Main entry point
 * Official SDK for integrating RAuth authentication in React and Next.js applications
 */

// Components
export { AuthComponent } from './components/AuthComponent';
export { AuthSkeleton, UserSkeleton, ContentSkeleton } from './components/LoadingSkeletons';

// Hooks
export { useAuth } from './hooks/useAuth';
export type { UseAuthReturn } from './hooks/useAuth';
export { useSession } from './hooks/useSession';
export { useMounted, useSSRSafe, useHydrationSafe, isServer, isBrowser } from './hooks/useSSR';

// Providers
export { AuthProvider, useAuthContext } from './providers/AuthProvider';

// Configuration
export { initRauth, getConfig, isConfigured } from './utils/config';

// API utilities
export {
  api,
  buildUrl,
  getAuthHeaders,
  apiRequest,
  getOAuthAuthorizeUrl,
  getCurrentUser as getCurrentUserAPI,
  refreshSession,
  deleteSession,
} from './utils/api';

// OAuth utilities
export {
  generateState,
  getCallbackUrl,
  initiateOAuth,
  validateState,
  handleOAuthCallback,
} from './utils/oauth';

// Storage utilities
export { storage, STORAGE_KEYS } from './utils/storage';

// JWT utilities
export {
  decodeJWT,
  isTokenExpired,
  getTokenExpiration,
  getTokenSubject,
  getTokenClaim,
} from './utils/jwt';

export type { JWTPayload } from './utils/jwt';

// Server-side utilities (for Next.js)
export {
  // Pages Router & API Routes
  getSessionAction,
  getUserAction,
  requireSession,
  requireUser,
  
  // App Router (Server Components & Server Actions)
  getSession,
  getCurrentUser,
  
  // Legacy (deprecated)
  getCurrentUserAction,
  validateSessionAction,
} from './server/actions';

export {
  // Middleware factory
  createAuthMiddleware,
  
  // Utility functions
  isPathMatch,
  matchesAnyPattern,
  isAuthenticated,
  
  // Legacy (deprecated)
  authMiddleware,
} from './server/middleware';

export type { AuthMiddlewareOptions } from './server/middleware';

// Types
export type {
  // Provider types
  ProviderName,
  
  // User and session types
  User,
  Session,
  
  // Configuration types
  RAuthConfig,
  StorageConfig,
  StorageType,
  CookieOptions,
  SameSite,
  
  // State types
  AuthState,
  
  // Response types
  LoginResponse,
  RefreshResponse,
  OAuthResponse,
  
  // Error types
  ApiError,
  
  // Component props
  AuthComponentProps,
  
  // Hook options
  UseSessionOptions,
  
  // Legacy types (deprecated)
  RefreshTokenResponse,
} from './utils/types';

// Constants
export {
  DEFAULT_BASE_URL,
  SUPPORTED_PROVIDERS,
  DEFAULT_REFRESH_THRESHOLD,
  DEFAULT_STORAGE_PREFIX,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
} from './utils/constants';
