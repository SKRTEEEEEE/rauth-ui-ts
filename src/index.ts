/**
 * RAuth SDK - Main entry point
 * Official SDK for integrating RAuth authentication in React and Next.js applications
 */

// Components
export { AuthComponent } from './components/AuthComponent';

// Hooks
export { useAuth } from './hooks/useAuth';
export type { UseAuthReturn } from './hooks/useAuth';
export { useSession } from './hooks/useSession';

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
  handleOAuthCallback,
  getCurrentUser,
  refreshSession,
  deleteSession,
} from './utils/api';

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
  getSessionAction,
  getCurrentUserAction,
  validateSessionAction,
} from './server/actions';

export {
  authMiddleware,
  isAuthenticated,
} from './server/middleware';

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
