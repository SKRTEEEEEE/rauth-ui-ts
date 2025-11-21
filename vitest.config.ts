import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    // Disable watch mode by default for CI/automation compatibility
    watch: false,
    setupFiles: ['./test/setup/vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '*.config.ts',
        '*.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      // Mock next/headers for testing (it's only available in Next.js runtime)
      'next/headers': new URL('./test/mocks/next-headers.mock.ts', import.meta.url).pathname,
      // Mock next/server for middleware testing
      'next/server': new URL('./test/mocks/next-server.mock.ts', import.meta.url).pathname
    }
  }
});
