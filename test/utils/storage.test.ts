/**
 * Tests for storage utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage, STORAGE_KEYS } from '../../src/utils/storage';

describe('Storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should store and retrieve items', () => {
    storage.setItem('test-key', 'test-value');
    const value = storage.getItem('test-key');
    
    expect(value).toBe('test-value');
  });

  it('should remove items', () => {
    storage.setItem('test-key', 'test-value');
    storage.removeItem('test-key');
    const value = storage.getItem('test-key');
    
    expect(value).toBeNull();
  });

  it('should handle access token operations', () => {
    storage.setAccessToken('access-token-123');
    const token = storage.getAccessToken();
    
    expect(token).toBe('access-token-123');
    
    storage.removeAccessToken();
    const removed = storage.getAccessToken();
    
    expect(removed).toBeNull();
  });

  it('should handle refresh token operations', () => {
    storage.setRefreshToken('refresh-token-123');
    const token = storage.getRefreshToken();
    
    expect(token).toBe('refresh-token-123');
  });

  it('should handle session ID operations', () => {
    storage.setSessionId('session-123');
    const id = storage.getSessionId();
    
    expect(id).toBe('session-123');
  });

  it('should handle user data operations', () => {
    const userData = JSON.stringify({ id: '123', email: 'test@example.com' });
    storage.setUser(userData);
    const user = storage.getUser();
    
    expect(user).toBe(userData);
  });

  it('should clear all RAuth data', () => {
    storage.setAccessToken('token');
    storage.setRefreshToken('refresh');
    storage.setSessionId('session');
    storage.setUser('user-data');
    
    storage.clear();
    
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
    expect(storage.getSessionId()).toBeNull();
    expect(storage.getUser()).toBeNull();
  });

  it('should export STORAGE_KEYS', () => {
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('rauth_access_token');
    expect(STORAGE_KEYS.REFRESH_TOKEN).toBe('rauth_refresh_token');
    expect(STORAGE_KEYS.SESSION_ID).toBe('rauth_session_id');
    expect(STORAGE_KEYS.USER).toBe('rauth_user');
  });
});
