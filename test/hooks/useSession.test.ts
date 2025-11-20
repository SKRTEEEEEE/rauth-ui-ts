/**
 * Tests for useSession hook
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSession } from '../../src/hooks/useSession';

// Mock the API module
vi.mock('../../src/utils/api', () => ({
  refreshToken: vi.fn().mockResolvedValue({
    accessToken: 'new-token',
    refreshToken: 'new-refresh',
    expiresAt: new Date().toISOString(),
  }),
}));

describe('useSession hook', () => {
  it('should provide refreshToken function', () => {
    const { result } = renderHook(() => useSession({ autoRefresh: false }));

    expect(result.current).toHaveProperty('refreshToken');
    expect(typeof result.current.refreshToken).toBe('function');
  });

  it.skip('should call onTokenRefreshed callback on successful refresh', async () => {
    const onTokenRefreshed = vi.fn();
    
    const { result } = renderHook(() => 
      useSession({ autoRefresh: false, onTokenRefreshed })
    );

    localStorage.setItem('rauth_refresh_token', 'refresh-token');
    
    await result.current.refreshToken();

    expect(onTokenRefreshed).toHaveBeenCalled();
  });

  it('should handle refresh errors', async () => {
    const onRefreshError = vi.fn();
    
    // Mock a failed refresh
    const { refreshToken } = await import('../../src/utils/api');
    vi.mocked(refreshToken).mockRejectedValueOnce(new Error('Refresh failed'));

    const { result } = renderHook(() => 
      useSession({ autoRefresh: false, onRefreshError })
    );

    localStorage.setItem('rauth_refresh_token', 'refresh-token');
    
    const success = await result.current.refreshToken();

    expect(success).toBe(false);
    expect(onRefreshError).toHaveBeenCalled();
  });
});
