# Quick Start Guide

Get up and running with RAuth in minutes.

## Installation

```bash
npm install rauth
```

## Step 1: Get Your API Key

1. Go to [RAuth Dashboard](https://dashboard.rauth.dev)
2. Create a new project
3. Copy your API key

## Step 2: Configure Providers

In the dashboard, enable the OAuth providers you want to use (Google, GitHub, Facebook).

## Step 3: Add to Your App

### React

```tsx
// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, AuthComponent } from 'rauth';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AuthProvider config={{ apiKey: 'your-api-key-here' }}>
    <App />
  </AuthProvider>
);

// App.tsx
import { useAuth, AuthComponent } from 'rauth';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My App</h1>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name || user?.email}!</p>
          <AuthComponent />
        </div>
      ) : (
        <AuthComponent providers={['google', 'github']} />
      )}
    </div>
  );
}

export default App;
```

### Next.js (App Router)

```tsx
// app/layout.tsx
import { AuthProvider } from 'rauth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider config={{ apiKey: process.env.NEXT_PUBLIC_RAUTH_API_KEY! }}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';

import { useAuth, AuthComponent } from 'rauth';

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <main>
      <h1>Welcome to RAuth</h1>
      {isAuthenticated ? (
        <div>
          <p>Hello, {user?.name || user?.email}!</p>
          <AuthComponent />
        </div>
      ) : (
        <AuthComponent providers={['google', 'github']} />
      )}
    </main>
  );
}
```

## Step 4: Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_RAUTH_API_KEY=your-api-key-here
```

## Step 5: Configure OAuth Callbacks

In your OAuth provider settings (Google Console, GitHub Apps, etc.), add these callback URLs:

- Development: `http://localhost:3000/auth/callback`
- Production: `https://yourdomain.com/auth/callback`

## Next Steps

- [API Reference](./API.md)
- [Advanced Configuration](./CONFIGURATION.md)
- [Examples](../examples/)

## Common Use Cases

### Protected Routes

```tsx
function ProtectedPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please login</div>;

  return <div>Protected content</div>;
}
```

### Custom Login Button

```tsx
import { initiateOAuth } from 'rauth';

function CustomLoginButton() {
  const handleLogin = async () => {
    const { authUrl } = await initiateOAuth('google');
    window.location.href = authUrl;
  };

  return <button onClick={handleLogin}>Login with Google</button>;
}
```

### Manual Token Refresh

```tsx
import { useSession } from 'rauth';

function MyComponent() {
  const { refreshToken } = useSession({ autoRefresh: false });

  return <button onClick={refreshToken}>Refresh Session</button>;
}
```

## Troubleshooting

### "useAuth must be used within AuthProvider"

Make sure your components are wrapped with `<AuthProvider>`.

### OAuth callback not working

1. Check your callback URLs in OAuth provider settings
2. Verify API key is correct
3. Check browser console for errors

### Token expiration issues

Enable auto-refresh in config:

```tsx
<AuthProvider config={{ apiKey: '...', autoRefresh: true }}>
```

## Need Help?

- [Documentation](https://docs.rauth.dev)
- [GitHub Issues](https://github.com/rauth/rauth-sdk-ts/issues)
- [Discord Community](https://discord.gg/rauth)
