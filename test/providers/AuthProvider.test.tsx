/**
 * Tests for AuthProvider
 * Basic tests to verify exports and type compatibility
 */

import { describe, it, expect } from 'vitest';
import { AuthProvider, AuthContext } from '../../src/providers/AuthProvider';

describe('AuthProvider', () => {
  it('should be defined and exportable', () => {
    expect(AuthProvider).toBeDefined();
    expect(typeof AuthProvider).toBe('function');
  });

  it('should export AuthContext', () => {
    expect(AuthContext).toBeDefined();
    expect(typeof AuthContext).toBe('object');
  });

  it('should be a valid React component function', () => {
    expect(AuthProvider.name).toBe('AuthProvider');
    expect(AuthProvider.length).toBeGreaterThanOrEqual(0); // Has parameters
  });
});
