# README QUICKSTART
Part extract from old readme about how start
## Quick Start

### React

```tsx
import { initRauth, AuthProvider, AuthComponent } from 'rauth';

// Initialize the SDK once at app startup
initRauth({
  apiKey: 'your-api-key',
  providers: ['google', 'github'],
});

function App() {
  return (
    <AuthProvider config={{ apiKey: 'your-api-key', providers: ['google', 'github'] }}>
      <AuthComponent provider="google" />
    </AuthProvider>
  );
}
```

### Next.js

#### Basic Client-Side Setup

```tsx
// app/providers.tsx (Client Component)
'use client';

import { AuthProvider, initRauth } from 'rauth';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize SDK on client side
    initRauth({
      apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY!,
      baseUrl: process.env.NEXT_PUBLIC_RAUTH_BASE_URL || undefined, // Optional: for local dev
      providers: ['google', 'github'],
    });
  }, []);

  return (
    <AuthProvider config={{ 
      apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY!,
      baseUrl: process.env.NEXT_PUBLIC_RAUTH_BASE_URL,
      providers: ['google', 'github']
    }}>
      {children}
    </AuthProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

// app/page.tsx
import { AuthComponent } from 'rauth';

export default function Home() {
  return <AuthComponent provider="google" />;
}
```

#### SSR-Optimized Setup (No Loading Flash)

For optimal SSR experience with no flash of unauthenticated content, use `initialSession`:

```tsx
// app/providers.tsx (Client Component)
'use client';

import { AuthProvider } from 'rauth';
import type { User, Session } from 'rauth';

interface ProvidersProps {
  children: React.ReactNode;
  initialSession?: { user: User; session: Session } | null;
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return (
    <AuthProvider 
      config={{ 
        apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY!,
        baseUrl: process.env.NEXT_PUBLIC_RAUTH_BASE_URL,
        providers: ['google', 'github']
      }}
      initialSession={initialSession}
    >
      {children}
    </AuthProvider>
  );
}

// app/layout.tsx (Server Component)
import { Providers } from './providers';
import { getSession } from 'rauth/server';

export default async function RootLayout({ children }) {
  // Get session from server-side cookies
  const initialSession = await getSession();

  return (
    <html>
      <body>
        <Providers initialSession={initialSession}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

#### With React Suspense

For progressive loading with Suspense boundaries:

```tsx
// app/page.tsx
import { Suspense } from 'react';
import { AuthComponent, AuthSkeleton } from 'rauth';

export default function Home() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <AuthComponent provider="google" />
    </Suspense>
  );
}
```

Available skeleton components:
- `<AuthSkeleton />` - Loading placeholder for auth buttons
- `<UserSkeleton />` - Loading placeholder for user profile
- `<ContentSkeleton />` - General loading placeholder
## Environment Setup

The SDK uses environment variables for configuration. We provide several environment files:

### Environment Files

- **`.env.example`** - Template showing all available variables (committed to git)
- **`.env.public`** - Public default values for development (committed to git)
- **`.env.local`** - Your personal configuration (ignored by git)

### Setup for Development with Local Backend

1. Copy `.env.public` to `.env.local`:
   ```bash
   cp .env.public .env.local
   ```

2. Update `.env.local` with your actual values:
   ```bash
   NEXT_PUBLIC_RAUTH_API_KEY=your_actual_api_key
   NEXT_PUBLIC_RAUTH_BASE_URL=http://localhost:8080
   NEXT_PUBLIC_RAUTH_DEBUG=true
   ```

### Setup for Production

For production, create `.env.local` with only the API key (uses default production URL):

```bash
NEXT_PUBLIC_RAUTH_API_KEY=your_production_api_key
# NEXT_PUBLIC_RAUTH_DEBUG=false (optional, defaults to false)
```

> **Note:** The `NEXT_PUBLIC_` prefix is for Next.js. For other frameworks:
> - **Vite**: Use `VITE_` prefix
> - **Create React App**: Use `REACT_APP_` prefix

## Core Components

### Configuration (initRauth)

Initialize the SDK once at the start of your application:

```tsx
import { initRauth } from 'rauth';

initRauth({
  apiKey: 'your-api-key',
  providers: ['google', 'github'],
  baseUrl: 'https://api.rauth.dev', // optional, defaults to production
  storage: {
    type: 'localStorage', // 'localStorage' | 'sessionStorage' | 'cookies'
    prefix: 'rauth_', // optional, defaults to 'rauth_'
  },
  debug: false, // optional, enables debug logging
});
```

### AuthProvider

Wrap your app with `AuthProvider` to enable authentication:

```tsx
<AuthProvider config={{ 
  apiKey: 'your-api-key',
  providers: ['google', 'github']
}}>
  <App />
</AuthProvider>
```

### AuthComponent

Single component that handles login, logout, and profile display:

```tsx
// Single provider
<AuthComponent provider="google" />

// Multiple providers
<AuthComponent providers={['google', 'github', 'facebook']} />

// With callbacks
<AuthComponent
  provider="google"
  onLoginSuccess={() => console.log('Logged in!')}
  onLogoutSuccess={() => console.log('Logged out!')}
  onError={(error) => console.error(error)}
/>
```

## Hooks

### useAuth

Get the current authentication state:

```tsx
import { useAuth } from 'rauth';

function Profile() {
  const { isAuthenticated, user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return <div>Welcome, {user.name}!</div>;
}
```

### useSession

Manage session lifecycle and automatic token refresh:

```tsx
import { useSession } from 'rauth';

function MyComponent() {
  const { 
    session,               // Current session object
    isExpired,             // Whether session is expired
    timeUntilExpiration,   // Milliseconds until token expires
    refreshToken           // Manual refresh function
  } = useSession({
    autoRefresh: true,                              // Auto-refresh tokens before expiration (default: true)
    refreshThreshold: 5 * 60 * 1000,                // Refresh 5 minutes before expiry (default: 5 min)
    onRefreshSuccess: (tokens) => {                 // Called after successful refresh
      console.log('Token refreshed', tokens);
    },
    onRefreshError: (error) => {                    // Called on refresh failure
      console.error('Refresh failed', error);
    },
    onSessionExpired: () => {                       // Called when session expires
      console.log('Session expired, please login again');
    },
  });

  return (
    <div>
      {session && <p>Session ID: {session.id}</p>}
      {timeUntilExpiration && (
        <p>Expires in: {Math.floor(timeUntilExpiration / 1000 / 60)} minutes</p>
      )}
      <button onClick={refreshToken}>Refresh Token Manually</button>
    </div>
  );
}
```

**Features:**
- ✅ Automatic token refresh before expiration (configurable threshold)
- ✅ Manual refresh capability
- ✅ Session expiration detection and cleanup
- ✅ Configurable callbacks for all events
- ✅ SSR-safe (works in Next.js server components)
- ✅ Cross-tab synchronization via storage events

## Configuration

```tsx
interface RAuthConfig {
  apiKey: string;                    // Required: Your API key from RAuth dashboard
  baseUrl?: string;                  // Optional: Custom API URL (default: https://api.rauth.dev)
  providers?: Provider[];            // Optional: Allowed providers
  autoRefresh?: boolean;             // Optional: Auto-refresh tokens (default: true)
}
```

## Server-Side (Next.js)

### Server Actions

```tsx
import { getSessionAction, getCurrentUserAction } from 'rauth';

export async function getServerSideProps() {
  const session = await getSessionAction();
  const user = await getCurrentUserAction();

  return { props: { session, user } };
}
```

### Middleware

```tsx
// middleware.ts
import { createAuthMiddleware } from 'rauth/server';

export const middleware = createAuthMiddleware({
  protectedPaths: ['/dashboard/*', '/profile'],
  publicPaths: ['/', '/login', '/signup', '/about'],
  loginPath: '/login'
});

export const config = {
  matcher: ['/dashboard/:path*', '/profile'],
};
```

**Middleware Options:**

- `protectedPaths`: Array of paths that require authentication (supports wildcards like `/dashboard/*`)
- `publicPaths`: Array of paths that are publicly accessible without authentication
- `loginPath`: Path to redirect to when authentication is required (default: `/login`)
- `requireAuth`: If `true`, all paths require auth unless in `publicPaths` (default: `false`)

**Example with requireAuth:**

```tsx
// Protect all routes except public ones
export const middleware = createAuthMiddleware({
  requireAuth: true,
  publicPaths: ['/', '/login', '/signup', '/about', '/api/*'],
  loginPath: '/login'
});
```

## Backend Integration

This SDK is designed to work with the RAuth backend service. For development and testing, you can run the backend locally.

### Prerequisites

- **Backend Running**: The RAuth backend must be running and accessible
  - Production: `https://api.rauth.dev` (default)
  - Development: `http://localhost:8080` (configurable via `VITE_RAUTH_BASE_URL`)
  
- **OAuth Configuration**: OAuth providers (Google, GitHub, etc.) must be configured in the backend

### Local Development Setup

1. **Start the Backend**:
   ```bash
   cd ../rauth-backend-go
   go run main.go
   ```
   Backend will be available at `http://localhost:8080`

2. **Verify Backend Health**:
   ```bash
   curl http://localhost:8080/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "database": "ok",
     "redis": "ok",
     "service": "rauth"
   }
   ```

3. **Configure SDK to Use Local Backend**:
   ```typescript
   initRauth({
     apiKey: 'your-api-key',
     baseUrl: 'http://localhost:8080', // Use local backend
     providers: ['google'],
     debug: true, // Enable debug logging
   });
   ```

### Testing Backend Integration

The SDK includes integration tests that validate connectivity with the real backend:

```bash
# Run integration tests (requires backend running)
npm test -- test/integration/
```

**Note**: Most integration tests are skipped by default (using `describe.skip`). To run them:
1. Ensure backend is running at `http://localhost:8080`
2. Edit test files to change `describe.skip` to `describe`
3. For tests requiring authentication, obtain valid tokens via OAuth flow

### Backend Endpoints Used

The SDK communicates with these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/oauth/authorize` | GET | Initiate OAuth flow |
| `/api/v1/oauth/callback` | POST | Exchange code for tokens |
| `/api/v1/users/me` | GET | Get current user |
| `/api/v1/sessions/refresh` | POST | Refresh access token |
| `/api/v1/sessions/:id` | DELETE | Logout (invalidate session) |

### CORS Configuration

For local development, ensure the backend has CORS configured to allow requests from your frontend origin:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

### Manual OAuth Flow Testing

To manually test the complete OAuth flow:

1. Start backend at `http://localhost:8080`
2. Start frontend: `npm run dev` (in `examples/basic-react`)
3. Open browser at `http://localhost:5173`
4. Open browser DevTools (Network tab)
5. Click "Sign in with Google"
6. Authorize with real Google account
7. Verify:
   - Redirect flow completes
   - Tokens saved to `localStorage`
   - User data displayed in UI
   - Network calls to backend succeed

Expected network sequence:
1. `GET /api/v1/oauth/authorize?provider=google&...`
2. Redirect to Google OAuth
3. Google callback to backend
4. `POST /api/v1/oauth/callback` (exchange code)
5. Redirect back to frontend with tokens
6. `GET /api/v1/users/me` (fetch user data)

### Troubleshooting

**CORS Errors**:
- Check backend CORS configuration
- Verify origin matches frontend URL

**401 Unauthorized**:
- Check access token in request headers
- Token may be expired (should auto-refresh)

**OAuth Errors**:
- Verify OAuth provider configured in backend
- Check redirect_uri matches backend whitelist
- Ensure state parameter preserved in sessionStorage

**Network Errors**:
- Verify backend is running and accessible
- Check `baseUrl` in SDK configuration
- Inspect browser console for detailed errors
