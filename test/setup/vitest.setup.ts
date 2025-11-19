/**
 * Vitest setup file
 * Configures global test environment
 */

import '@testing-library/jest-dom';

// Mock localStorage if not available
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  } as Storage;
}
