# RAuth SDK

Official TypeScript SDK for integrating RAuth authentication in React and Next.js applications.

## Installation

```bash
npm install rauth
```

## 📚 Examples

Check out the [basic React example](./examples/basic-react) to see the SDK in action. The example demonstrates:
- SDK initialization
- AuthProvider setup
- Multiple ways to use AuthComponent
- Component customization options

To run the example:
```bash
cd examples/basic-react
npm install
npm run dev
```

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

## Features

- 🔐 **OAuth Authentication** - Support for Google, GitHub, and Facebook
- ⚛️ **React Integration** - Hooks and components for easy integration
- 🚀 **Next.js Compatible** - Full SSR support with App Router
- 🔄 **Auto Token Refresh** - Automatic session management
- 📦 **Lightweight** - Minimal dependencies
- 🎨 **Customizable** - Easy to style and configure
- 🔒 **Type Safe** - Full TypeScript support

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
import { authMiddleware } from 'rauth';

export const middleware = authMiddleware;

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

## API Reference

See [docs/API.md](./docs/API.md) for detailed API documentation.

## Examples

Check the [examples/](./examples/) directory for complete example applications.

## TypeScript

This SDK is written in TypeScript and includes type definitions out of the box.

```tsx
import type { User, Session, AuthState, RAuthConfig } from 'rauth';
```

## Development

### Setup

```bash
npm install
```

### Scripts

- `npm run dev` - Start development server with Vite
- `npm run build` - Build the library for production
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run typecheck` - Run TypeScript type checking
- `npm run preview` - Preview the production build

### Building

The SDK is built with Vite and generates:
- ESM format (`dist/index.mjs`)
- CommonJS format (`dist/index.cjs`)
- TypeScript declarations (`dist/index.d.ts`)
- Source maps for debugging

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT

## Support

- Documentation: https://docs.rauth.dev
- GitHub Issues: https://github.com/rauth/rauth-sdk-ts/issues
- Discord: https://discord.gg/rauth
