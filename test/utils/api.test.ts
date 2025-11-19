/**
 * Tests for API utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initApi, getApiConfig, initiateOAuth, getCurrentUser } from '../../src/utils/api';

// Mock fetch
global.fetch = vi.fn();

describe('API utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset API config to default state
    initApi('', 'https://api.rauth.dev');
  });

  it('should initialize API configuration', () => {
    initApi('test-api-key', 'https://test.api.com');
    const config = getApiConfig();

    expect(config.apiKey).toBe('test-api-key');
    expect(config.baseUrl).toBe('https://test.api.com');
  });

  it('should use default base URL if not provided', () => {
    // First reset to default
    initApi('', 'https://api.rauth.dev');
    // Then init with only API key
    initApi('test-api-key');
    const config = getApiConfig();

    expect(config.baseUrl).toBe('https://api.rauth.dev');
  });

  it('should make OAuth initiation request', async () => {
    const mockResponse = {
      authUrl: 'https://oauth.provider.com/authorize',
      state: 'random-state',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    initApi('test-key');
    const response = await initiateOAuth('google');

    expect(response.authUrl).toBe(mockResponse.authUrl);
    expect(response.state).toBe(mockResponse.state);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/oauth/authorize?provider=google'),
      expect.any(Object)
    );
  });

  it('should throw error on API failure', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'BadRequest', message: 'Invalid provider' }),
    });

    initApi('test-key');
    
    await expect(initiateOAuth('invalid' as any)).rejects.toThrow('Invalid provider');
  });

  it('should get current user with auth token', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      provider: 'google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });

    initApi('test-key');
    localStorage.setItem('rauth_access_token', 'test-token');
    
    const user = await getCurrentUser();

    expect(user.id).toBe('user-123');
    expect(user.email).toBe('test@example.com');
  });
});
