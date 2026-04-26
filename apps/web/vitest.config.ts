import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@tinybooth/web`. Node environment because every test
 * exercises server modules (tRPC routers, REST handlers, storage). React
 * component tests for Phase 1 are minimal (the wall app owns that surface).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/server/api/**/*.ts',
        'src/lib/**/*.ts',
        'app/api/**/*.ts',
      ],
      exclude: ['**/*.d.ts', 'prisma/generated/**'],
    },
  },
});
