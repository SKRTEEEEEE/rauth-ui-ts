/**
 * Mock for next/headers module
 * 
 * This mock is used in tests to simulate Next.js App Router context.
 * In real Next.js apps, this module is provided by the framework.
 */

/**
 * Mock cookies() function
 * Returns empty cookies by default, can be overridden in tests
 */
export function cookies() {
  return {
    getAll: () => [],
    get: () => undefined,
    set: () => {},
    delete: () => {}
  };
}

/**
 * Mock headers() function
 * Returns empty headers by default, can be overridden in tests
 */
export function headers() {
  return new Map();
}
