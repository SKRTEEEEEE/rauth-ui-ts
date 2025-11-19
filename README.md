# RAuth SDK

Official TypeScript SDK for integrating RAuth authentication in React and Next.js applications.

## Installation

```bash
npm install rauth
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
      providers: ['google', 'github'],
    });
  }, []);

  return (
    <AuthProvider config={{ 
      apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY!,
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

Manage session and token refresh:

```tsx
import { useSession } from 'rauth';

function MyComponent() {
  const { refreshToken } = useSession({
    autoRefresh: true,
    onTokenRefreshed: () => console.log('Token refreshed'),
    onRefreshError: (error) => console.error('Refresh failed', error),
  });

  return <button onClick={refreshToken}>Refresh Token</button>;
}
```

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
