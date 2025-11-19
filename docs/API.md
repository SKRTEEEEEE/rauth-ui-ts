# RAuth SDK API Reference

Complete API reference for the RAuth TypeScript SDK.

## Components

### `<AuthProvider>`

Context provider for authentication state.

**Props:**

```typescript
interface AuthProviderProps {
  children: ReactNode;
  config: RAuthConfig;
}

interface RAuthConfig {
  apiKey: string;
  baseUrl?: string;
  providers?: Provider[];
  autoRefresh?: boolean;
}
```

**Example:**

```tsx
<AuthProvider config={{ apiKey: 'your-api-key' }}>
  <App />
</AuthProvider>
```

### `<AuthComponent>`

Main authentication component for login/logout.

**Props:**

```typescript
interface AuthComponentProps {
  provider?: Provider;           // Single provider mode
  providers?: Provider[];        // Multiple providers mode
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
  onError?: (error: Error) => void;
}

type Provider = 'google' | 'github' | 'facebook';
```

**Example:**

```tsx
<AuthComponent
  provider="google"
  onLoginSuccess={() => console.log('Success')}
/>
```

## Hooks

### `useAuth()`

Returns the current authentication state.

**Returns:**

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}
```

**Example:**

```tsx
const { isAuthenticated, user, loading } = useAuth();
```

### `useSession(options)`

Manages session and token refresh.

**Parameters:**

```typescript
interface UseSessionOptions {
  autoRefresh?: boolean;
  onTokenRefreshed?: () => void;
  onRefreshError?: (error: Error) => void;
}
```

**Returns:**

```typescript
{
  refreshToken: () => Promise<boolean>;
}
```

**Example:**

```tsx
const { refreshToken } = useSession({
  autoRefresh: true,
  onTokenRefreshed: () => console.log('Refreshed'),
});
```

## API Functions

### `initApi(apiKey, baseUrl?)`

Initialize the API configuration.

```typescript
initApi('your-api-key', 'https://custom-api.com');
```

### `getApiConfig()`

Get current API configuration.

```typescript
const config = getApiConfig();
// { apiKey: '...', baseUrl: '...' }
```

### `initiateOAuth(provider)`

Start OAuth flow for a provider.

```typescript
const { authUrl, state } = await initiateOAuth('google');
window.location.href = authUrl;
```

### `getCurrentUser()`

Get current authenticated user.

```typescript
const user = await getCurrentUser();
```

### `refreshToken()`

Refresh access token.

```typescript
const { accessToken, refreshToken } = await refreshToken();
```

### `deleteSession(sessionId)`

Delete session (logout).

```typescript
await deleteSession('session-id');
```

## Storage Utilities

### `storage`

```typescript
storage.getAccessToken(): string | null
storage.setAccessToken(token: string): void
storage.removeAccessToken(): void

storage.getRefreshToken(): string | null
storage.setRefreshToken(token: string): void
storage.removeRefreshToken(): void

storage.getSessionId(): string | null
storage.setSessionId(id: string): void
storage.removeSessionId(): void

storage.getUser(): string | null
storage.setUser(user: string): void
storage.removeUser(): void

storage.clear(): void
```

### `STORAGE_KEYS`

```typescript
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'rauth_access_token',
  REFRESH_TOKEN: 'rauth_refresh_token',
  SESSION_ID: 'rauth_session_id',
  USER: 'rauth_user',
}
```

## JWT Utilities

### `decodeJWT(token)`

Decode JWT token (without verification).

```typescript
const payload = decodeJWT(token);
// { sub: 'user-id', exp: 1234567890, ... }
```

### `isTokenExpired(token)`

Check if token is expired.

```typescript
if (isTokenExpired(token)) {
  // Refresh token
}
```

### `getTokenExpiration(token)`

Get expiration date of token.

```typescript
const expiry = getTokenExpiration(token);
// Date object
```

### `getTokenSubject(token)`

Get subject (user ID) from token.

```typescript
const userId = getTokenSubject(token);
```

## Server Actions (Next.js)

### `getSessionAction()`

Get session from server-side.

```typescript
const session = await getSessionAction();
```

### `getCurrentUserAction()`

Get user from server-side.

```typescript
const user = await getCurrentUserAction();
```

### `validateSessionAction(sessionId)`

Validate session on server.

```typescript
const isValid = await validateSessionAction('session-id');
```

## Server Middleware (Next.js)

### `authMiddleware(request)`

Protect routes with authentication.

```typescript
// middleware.ts
export const middleware = authMiddleware;
```

### `isAuthenticated(request)`

Check if request is authenticated.

```typescript
const authed = await isAuthenticated(request);
```

## Types

### `User`

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: Provider;
  createdAt: string;
  updatedAt: string;
}
```

### `Session`

```typescript
interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  createdAt: string;
}
```

### `AuthState`

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: Error | null;
}
```

### `RAuthConfig`

```typescript
interface RAuthConfig {
  apiKey: string;
  baseUrl?: string;
  providers?: Provider[];
  autoRefresh?: boolean;
}
```

### `Provider`

```typescript
type Provider = 'google' | 'github' | 'facebook';
```
