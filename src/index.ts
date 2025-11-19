/**
 * RAuth SDK - Main entry point
 * Official SDK for integrating RAuth authentication in React and Next.js applications
 */

// Components
export { AuthComponent } from './components/AuthComponent';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useSession } from './hooks/useSession';

// Providers
export { AuthProvider } from './providers/AuthProvider';

// API utilities
export {
  api,
  initApi,
  getApiConfig,
  initiateOAuth,
  getCurrentUser,
  refreshToken,
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
} from './utils/jwt';

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
  Provider,
  User,
  Session,
  AuthState,
  RAuthConfig,
  ApiError,
  OAuthResponse,
  RefreshTokenResponse,
} from './utils/types';
