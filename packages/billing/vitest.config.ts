import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@tinybooth/billing`. Pure logic package, node env, full
 * coverage on the entitlement evaluator.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.d.ts', 'src/index.ts'],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 100,
      },
    },
  },
});
