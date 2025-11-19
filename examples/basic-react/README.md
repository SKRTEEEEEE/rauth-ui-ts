# RAuth SDK - Basic React Example

This example demonstrates how to use the RAuth SDK in a React application for seamless OAuth authentication.

## 🚀 Quick Start

### 1. Install Dependencies

First, make sure the RAuth SDK is built:

```bash
# From the SDK root directory (../../)
cd ../../
npm install
npm run build
```

Then install the example's dependencies:

```bash
# From this directory
npm install
```

### 2. Configure the SDK

The example is pre-configured with placeholder values. For real authentication:

1. Get your API key from the [RAuth Dashboard](https://dashboard.rauth.dev)
2. Update the configuration in `src/App.tsx`:

```tsx
const config = initRauth({
  apiKey: 'your-real-api-key-here',
  baseUrl: 'https://api.rauth.dev', // or your backend URL
  providers: ['google', 'github', 'facebook'],
});
```

Or use environment variables:

```bash
# Create .env file
VITE_RAUTH_API_KEY=your-api-key
VITE_RAUTH_BASE_URL=http://localhost:8080
```

### 3. Run the Example

```bash
npm run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

## 📚 What This Example Demonstrates

### 1. SDK Initialization

```tsx
import { initRauth } from 'rauth';

const config = initRauth({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:8080',
  providers: ['google', 'github', 'facebook'],
});
```

### 2. AuthProvider Setup

```tsx
import { AuthProvider } from 'rauth';

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  );
}
```

### 3. AuthComponent Usage

**Default (all configured providers):**
```tsx
<AuthComponent />
```

**Single provider:**
```tsx
<AuthComponent provider="google" />
```

**Multiple specific providers:**
```tsx
<AuthComponent providers={['google', 'github']} />
```

**With customization:**
```tsx
<AuthComponent
  providers={['google', 'facebook']}
  className="custom-auth"
  loginButtonText="Sign in with {provider}"
  logoutButtonText="Sign out"
  showAvatar={true}
  onLoginSuccess={() => console.log('Login started')}
  onLogoutSuccess={() => console.log('Logged out')}
  onError={(error) => console.error('Error:', error)}
/>
```

## 🔧 Features Shown

- ✅ SDK initialization with `initRauth()`
- ✅ App wrapping with `AuthProvider`
- ✅ Multiple ways to use `AuthComponent`
- ✅ Component customization options
- ✅ Event callbacks (onLoginSuccess, onLogoutSuccess, onError)
- ✅ TypeScript type safety
- ✅ SSR-compatible patterns

## 🏗️ Project Structure

```
basic-react/
├── src/
│   ├── App.tsx         # Main app with RAuth examples
│   ├── App.css         # Styles
│   ├── main.tsx        # Entry point
│   ├── index.css       # Global styles
│   └── vite-env.d.ts   # Vite environment types
├── index.html          # HTML template
├── package.json        # Dependencies (uses local SDK)
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
└── README.md           # This file
```

## 🔄 Development Workflow

When making changes to the SDK:

1. Make changes in SDK source (`../../src/`)
2. Rebuild the SDK: `cd ../../ && npm run build`
3. The example will automatically pick up changes
4. Refresh the browser

## 📖 Next Steps

1. **Try Authentication:**
   - Set up the RAuth backend (see [rauth-backend-go](https://github.com/rauth/rauth-backend-go))
   - Configure OAuth providers in your RAuth dashboard
   - Update the `apiKey` and `baseUrl` in this example
   - Click login buttons to test the OAuth flow

2. **Explore Advanced Features:**
   - Use the `useAuth()` hook for custom UI
   - Implement protected routes
   - Add server-side authentication with Next.js
   - Customize the AuthComponent styling

3. **Check Documentation:**
   - [RAuth SDK Documentation](https://docs.rauth.dev)
   - [API Reference](../../docs/API.md)
   - [GitHub Repository](https://github.com/rauth/rauth-sdk-ts)

## 🐛 Troubleshooting

### "Cannot find module 'rauth'"

Make sure you've built the SDK:
```bash
cd ../../
npm run build
```

### TypeScript Errors

Ensure both the SDK and example have dependencies installed:
```bash
cd ../../ && npm install
cd examples/basic-react && npm install
```

### OAuth Flow Not Working

1. Verify backend is running (usually `http://localhost:8080`)
2. Check API key is correct
3. Ensure OAuth providers are configured in RAuth dashboard
4. Check browser console for errors

## 📝 License

This example is part of the RAuth SDK and is licensed under the MIT License.

## 🤝 Support

- **Documentation:** [https://docs.rauth.dev](https://docs.rauth.dev)
- **Issues:** [GitHub Issues](https://github.com/rauth/rauth-sdk-ts/issues)
- **Discussions:** [GitHub Discussions](https://github.com/rauth/rauth-sdk-ts/discussions)
