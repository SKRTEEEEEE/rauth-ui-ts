/**
 * RAuth SDK - Basic React Example
 * 
 * This example demonstrates the core features of the RAuth SDK:
 * 1. SDK initialization with initRauth()
 * 2. Wrapping the app with AuthProvider
 * 3. Using AuthComponent for authentication UI
 * 4. Single provider vs multiple providers
 * 5. Component customization options
 */

import { useEffect } from 'react';
import { AuthProvider, AuthComponent, initRauth } from 'rauth';
import './App.css';

/**
 * Initialize RAuth SDK
 * This should be done once at application startup
 * 
 * In production, use environment variables:
 * - VITE_RAUTH_API_KEY for apiKey
 * - VITE_RAUTH_BASE_URL for baseUrl
 */
const config = initRauth({
  // EXAMPLE ONLY - Replace with your actual API key from RAuth dashboard
  // This is a placeholder value for demonstration purposes
  apiKey: 'example-api-key-12345',
  
  // Backend URL - use your deployed backend or local dev server
  baseUrl: import.meta.env.VITE_RAUTH_BASE_URL || 'http://localhost:8080',
  
  // OAuth providers to enable
  providers: ['google', 'github', 'facebook'],
});

console.log('RAuth initialized with config:', config);

/**
 * Main App Component
 * 
 * Shows different ways to use AuthComponent:
 * - Default (uses all providers from config)
 * - Single provider
 * - Multiple specific providers
 * - With customization options
 */
function App() {
  useEffect(() => {
    console.log('RAuth Example App mounted');
  }, []);

  return (
    <AuthProvider>
      <div className="app">
        {/* Header */}
        <header className="header">
          <h1>🔐 RAuth SDK - Basic React Example</h1>
          <p className="subtitle">
            Seamless OAuth authentication for React applications
          </p>
        </header>

        {/* Main Content */}
        <main className="content">
          {/* Section 1: Default AuthComponent */}
          <section className="section">
            <h2>1. Default Authentication</h2>
            <p className="description">
              Uses all providers configured in <code>initRauth()</code>
            </p>
            <div className="demo-box">
              <AuthComponent />
            </div>
            <details className="code-details">
              <summary>View Code</summary>
              <pre>{`<AuthComponent />`}</pre>
            </details>
          </section>

          {/* Section 2: Single Provider */}
          <section className="section">
            <h2>2. Single Provider Login</h2>
            <p className="description">
              Specify a single provider with the <code>provider</code> prop
            </p>
            <div className="demo-box">
              <AuthComponent provider="google" />
            </div>
            <details className="code-details">
              <summary>View Code</summary>
              <pre>{`<AuthComponent provider="google" />`}</pre>
            </details>
          </section>

          {/* Section 3: Multiple Specific Providers */}
          <section className="section">
            <h2>3. Multiple Specific Providers</h2>
            <p className="description">
              Choose specific providers with the <code>providers</code> array prop
            </p>
            <div className="demo-box">
              <AuthComponent providers={['google', 'github']} />
            </div>
            <details className="code-details">
              <summary>View Code</summary>
              <pre>{`<AuthComponent providers={['google', 'github']} />`}</pre>
            </details>
          </section>

          {/* Section 4: Customization */}
          <section className="section">
            <h2>4. Customized Component</h2>
            <p className="description">
              Customize text, styling, and behavior with props
            </p>
            <div className="demo-box">
              <AuthComponent
                providers={['google', 'facebook']}
                className="custom-auth"
                loginButtonText="Sign in with {provider}"
                logoutButtonText="Sign out"
                showAvatar={true}
                onLoginSuccess={() => console.log('Login flow started!')}
                onLogoutSuccess={() => console.log('Logged out successfully!')}
                onError={(error) => console.error('Auth error:', error)}
              />
            </div>
            <details className="code-details">
              <summary>View Code</summary>
              <pre>{`<AuthComponent
  providers={['google', 'facebook']}
  className="custom-auth"
  loginButtonText="Sign in with {provider}"
  logoutButtonText="Sign out"
  showAvatar={true}
  onLoginSuccess={() => console.log('Login flow started!')}
  onLogoutSuccess={() => console.log('Logged out successfully!')}
  onError={(error) => console.error('Auth error:', error)}
/>`}</pre>
            </details>
          </section>

          {/* Features Info */}
          <section className="section info-section">
            <h2>✨ Key Features</h2>
            <ul className="features-list">
              <li>
                <strong>Automatic State Detection:</strong> Component automatically 
                shows login/logout based on authentication state
              </li>
              <li>
                <strong>Multiple OAuth Providers:</strong> Google, GitHub, Facebook, 
                Apple, Microsoft and more
              </li>
              <li>
                <strong>TypeScript Support:</strong> Full type safety with 
                comprehensive type definitions
              </li>
              <li>
                <strong>SSR Compatible:</strong> Works with Next.js server-side 
                rendering and server components
              </li>
              <li>
                <strong>Customizable:</strong> Extensive props for styling and 
                behavior customization
              </li>
              <li>
                <strong>Lightweight:</strong> Minimal dependencies, optimized bundle size
              </li>
            </ul>
          </section>

          {/* Next Steps */}
          <section className="section info-section">
            <h2>🚀 Next Steps</h2>
            <ol className="steps-list">
              <li>
                Get your API key from the{' '}
                <a href="https://dashboard.rauth.dev" target="_blank" rel="noopener noreferrer">
                  RAuth Dashboard
                </a>
              </li>
              <li>
                Update the <code>apiKey</code> in this example with your real key
              </li>
              <li>
                Configure your backend URL (local dev or production)
              </li>
              <li>
                Enable OAuth providers in your RAuth project settings
              </li>
              <li>
                Try logging in with different providers
              </li>
              <li>
                Explore advanced features like <code>useAuth()</code> hook and 
                server-side utilities
              </li>
            </ol>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>
            Built with <span className="heart">❤️</span> by the RAuth Team
          </p>
          <p className="links">
            <a href="https://github.com/rauth/rauth-sdk-ts" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            {' • '}
            <a href="https://docs.rauth.dev" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
            {' • '}
            <a href="https://rauth.dev" target="_blank" rel="noopener noreferrer">
              Website
            </a>
          </p>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
