/**
 * AuthComponent - Single component handling login, logout, and profile display
 */

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { ProviderName } from '../utils/types';
import { initiateOAuth, deleteSession } from '../utils/api';
import { storage } from '../utils/storage';

interface AuthComponentProps {
  provider?: ProviderName;
  providers?: ProviderName[];
  onLoginSuccess?: () => void;
  onLogoutSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Main authentication component
 * Handles OAuth login flow, user profile display, and logout
 */
export function AuthComponent({
  provider,
  providers = ['google', 'github'] as ProviderName[],
  onLoginSuccess,
  onLogoutSuccess,
  onError,
}: AuthComponentProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  const handleLogin = async (selectedProvider: ProviderName) => {
    try {
      setActionLoading(true);
      const response = await initiateOAuth(selectedProvider);
      
      // Redirect to OAuth URL
      window.location.href = response.authUrl;
      
      onLoginSuccess?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Login failed');
      onError?.(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setActionLoading(true);
      const sessionId = storage.getSessionId();
      
      if (sessionId) {
        await deleteSession(sessionId);
      }
      
      // Clear local storage
      storage.clear();
      
      onLogoutSuccess?.();
      
      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Logout failed');
      onError?.(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rauth-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="rauth-profile">
        <div className="rauth-user-info">
          {user.avatar && <img src={user.avatar} alt={user.name || user.email} />}
          <div>
            <p>{user.name || user.email}</p>
            <small>{user.email}</small>
          </div>
        </div>
        <button onClick={handleLogout} disabled={actionLoading}>
          {actionLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  // Single provider mode
  if (provider) {
    return (
      <div className="rauth-login">
        <button onClick={() => handleLogin(provider)} disabled={actionLoading}>
          {actionLoading ? 'Loading...' : `Login with ${provider}`}
        </button>
      </div>
    );
  }

  // Multiple providers mode
  return (
    <div className="rauth-login-multi">
      <div className="rauth-providers">
        {providers.map((p) => (
          <button key={p} onClick={() => handleLogin(p)} disabled={actionLoading}>
            {actionLoading ? 'Loading...' : `Login with ${p}`}
          </button>
        ))}
      </div>
    </div>
  );
}
