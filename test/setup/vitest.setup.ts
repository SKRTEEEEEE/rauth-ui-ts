/**
 * Vitest setup file
 * Runs before all tests to configure the test environment
 */

import { beforeEach } from 'vitest';

// Simple in-memory storage implementation for tests
class LocalStorageMock {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  get length(): number {
    return this.store.size;
  }
}

// Set up localStorage and sessionStorage
global.localStorage = new LocalStorageMock() as any;
global.sessionStorage = new LocalStorageMock() as any;

// Reset storage before each test
beforeEach(() => {
  global.localStorage.clear();
  global.sessionStorage.clear();
});
