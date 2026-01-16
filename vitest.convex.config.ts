import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Convex function tests using convex-test (mocked backend)
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['tests/convex/**/*.test.ts'],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
