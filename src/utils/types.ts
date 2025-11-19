/**
 * Core types and interfaces for the RAuth SDK
 * 
 * This file defines all the TypeScript interfaces and types that represent
 * the data models used throughout the SDK, ensuring type safety and
 * compatibility with the RAuth backend Go API.
 */

/**
 * Supported OAuth provider names
 * 
 * Union type representing all OAuth providers supported by RAuth.
 * Matches the provider names from the backend Go API.
 */
export type ProviderName = 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin';

/**
 * User information returned from the RAuth API
 * 
 * Represents a user account with profile information and metadata.
 * Corresponds to the User model in the backend Go API.
 * 
 * @property id - Unique user identifier
 * @property email - User's email address
 * @property name - User's display name (optional)
 * @property avatar - URL to user's avatar image (optional)
 * @property emailVerified - Whether the user's email has been verified
 * @property createdAt - ISO 8601 timestamp when the user was created
 * @property updatedAt - ISO 8601 timestamp when the user was last updated
 * @property metadata - Additional custom data (optional)
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Session information with authentication tokens
 * 
 * Represents an active user session with OAuth tokens and metadata.
 * Corresponds to the Session model in the backend Go API.
 * 
 * @property id - Unique session identifier
 * @property userId - ID of the user who owns this session
 * @property accessToken - JWT access token for API authentication
 * @property refreshToken - Token used to refresh the access token
 * @property expiresAt - Unix timestamp (milliseconds) when the access token expires
 * @property createdAt - ISO 8601 timestamp when the session was created
 * @property provider - OAuth provider used for this session
 * @property ipAddress - IP address from which the session was created (optional)
 * @property userAgent - User agent string from the session creation (optional)
 */
export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: string;
  provider: ProviderName;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * OAuth provider configuration
 * 
 * Represents the configuration for an OAuth provider.
 * Corresponds to the Provider model in the backend Go API.
 * 
 * @property name - Provider identifier
 * @property enabled - Whether this provider is currently enabled
 * @property clientId - OAuth client ID for this provider
 * @property scopes - Array of OAuth scopes to request
 * @property authorizeUrl - OAuth authorization endpoint URL
 * @property callbackUrl - Callback URL after OAuth authorization
 */
export interface Provider {
  name: ProviderName;
  enabled: boolean;
  clientId: string;
  scopes: string[];
  authorizeUrl: string;
  callbackUrl: string;
}

/**
 * Storage type options for SDK configuration
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookies';

/**
 * SameSite cookie attribute options
 */
export type SameSite = 'strict' | 'lax' | 'none';

/**
 * Cookie configuration options
 * 
 * Options for configuring cookie-based storage.
 * 
 * @property domain - Cookie domain (optional)
 * @property path - Cookie path (optional)
 * @property secure - Whether the cookie requires HTTPS (optional)
 * @property sameSite - SameSite attribute for CSRF protection (optional)
 * @property maxAge - Maximum age of the cookie in seconds (optional)
 */
export interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: SameSite;
  maxAge?: number;
}

/**
 * Storage configuration
 * 
 * Configuration for how the SDK stores authentication data.
 * 
 * @property type - Storage mechanism to use
 * @property prefix - Prefix for storage keys (optional)
 * @property cookieOptions - Additional options if using cookies (optional)
 */
export interface StorageConfig {
  type: StorageType;
  prefix?: string;
  cookieOptions?: CookieOptions;
}

/**
 * Global RAuth SDK configuration
 * 
 * Configuration object for initializing the RAuth SDK.
 * 
 * @property apiKey - API key from the RAuth dashboard
 * @property baseUrl - Base URL of the RAuth backend API (optional)
 * @property providers - Array of enabled OAuth providers (optional)
 * @property redirectUrl - URL to redirect after successful login (optional)
 * @property logoutRedirectUrl - URL to redirect after logout (optional)
 * @property storage - Storage configuration options (optional)
 * @property debug - Enable debug logging (optional)
 */
export interface RAuthConfig {
  apiKey: string;
  baseUrl?: string;
  providers?: ProviderName[];
  redirectUrl?: string;
  logoutRedirectUrl?: string;
  storage?: StorageConfig;
  debug?: boolean;
}

/**
 * Authentication state
 * 
 * Represents the current authentication state of the application.
 * Used by useAuth hook and AuthProvider context.
 * 
 * @property isAuthenticated - Whether a user is currently authenticated
 * @property user - Current user information (null if not authenticated)
 * @property session - Current session information (null if not authenticated)
 * @property loading - Whether authentication state is being loaded
 * @property error - Error message if authentication failed (optional)
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  error?: string;
}

/**
 * Login response from the backend
 * 
 * Response returned after successful OAuth login.
 * Contains user information, session details, and tokens.
 * 
 * @property user - User information
 * @property session - Session information
 * @property accessToken - JWT access token
 * @property refreshToken - Token for refreshing the access token
 * @property expiresAt - Unix timestamp (milliseconds) when the token expires
 */
export interface LoginResponse {
  user: User;
  session: Session;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Token refresh response
 * 
 * Response returned after successfully refreshing an access token.
 * 
 * @property accessToken - New JWT access token
 * @property refreshToken - New refresh token
 * @property expiresAt - Unix timestamp (milliseconds) when the new token expires
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * API error response
 * 
 * Standard error format returned by the RAuth API.
 * 
 * @property message - Human-readable error message
 * @property code - Machine-readable error code
 * @property status - HTTP status code
 * @property details - Additional error details (optional)
 */
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, unknown>;
}

/**
 * Props for the AuthComponent
 * 
 * Configuration and callbacks for the unified authentication component.
 * 
 * @property provider - OAuth provider to use for authentication
 * @property className - Additional CSS classes (optional)
 * @property showAvatar - Whether to show user avatar when logged in (optional)
 * @property loginButtonText - Custom text for login button (optional)
 * @property logoutButtonText - Custom text for logout button (optional)
 * @property onLoginSuccess - Callback invoked after successful login (optional)
 * @property onLogout - Callback invoked after logout (optional)
 * @property onError - Callback invoked on authentication error (optional)
 */
export interface AuthComponentProps {
  provider: ProviderName;
  className?: string;
  showAvatar?: boolean;
  loginButtonText?: string;
  logoutButtonText?: string;
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  onError?: (error: string) => void;
}

/**
 * Options for the useSession hook
 * 
 * Configuration for automatic token refresh and session management.
 * 
 * @property autoRefresh - Whether to automatically refresh tokens (optional)
 * @property refreshThreshold - Time in milliseconds before expiry to trigger refresh (optional)
 * @property onRefreshSuccess - Callback invoked after successful token refresh (optional)
 * @property onRefreshError - Callback invoked if token refresh fails (optional)
 * @property onSessionExpired - Callback invoked when session expires (optional)
 */
export interface UseSessionOptions {
  autoRefresh?: boolean;
  refreshThreshold?: number;
  onRefreshSuccess?: (tokens: RefreshResponse) => void;
  onRefreshError?: (error: string) => void;
  onSessionExpired?: () => void;
}

/**
 * OAuth authorization response
 * 
 * Response from initiating OAuth flow.
 * 
 * @property authUrl - URL to redirect the user for OAuth authorization
 * @property state - CSRF protection state parameter
 */
export interface OAuthResponse {
  authUrl: string;
  state: string;
}

/**
 * @deprecated Use RefreshResponse instead
 */
export interface RefreshTokenResponse extends RefreshResponse {}
