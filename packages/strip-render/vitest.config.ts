import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@tinybooth/strip-render`. Coverage is gated to the pure
 * layout + watermark modules where we enforce 100%. The Sharp backend is
 * exercised functionally; the Skia backend is skipped because it requires the
 * native runtime.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/layout.ts', 'src/watermark.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        statements: 100,
        branches: 100,
      },
    },
  },
});
