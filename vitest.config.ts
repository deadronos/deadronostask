import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests found under /tests with .test. or .spec. suffix
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],

    // Use a browser-like environment for React testing
    environment: 'jsdom',

    // Global setup for testing library matchers and shared mocks
    setupFiles: ['tests/setup.ts'],

    // Keep explicit imports from 'vitest' in tests (no globals)
    globals: false,

    // Better isolation for flaky tests
    isolate: true,

    // Coverage configuration
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['tests/**', 'src/convex/_generated/**', 'node_modules/**'],
    },

    // Fail the run if no tests are found (helpful in CI)
    passWithNoTests: false,
    slowTestThreshold: 500,
  },

  // Resolve `@/*` imports to ./src for tests and tooling parity with TS paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
