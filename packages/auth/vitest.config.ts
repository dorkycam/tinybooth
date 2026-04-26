import { defineConfig } from 'vitest/config';

/** Vitest config for the auth package. Node only; no React tree. */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts'],
    },
  },
});
