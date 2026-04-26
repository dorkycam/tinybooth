import { defineConfig } from 'vitest/config';

/**
 * Vitest config for `@tinybooth/web`. Node environment because every test
 * exercises server modules (tRPC routers, REST handlers, storage, plus
 * the Phase 5 marketing-page metadata exports). The esbuild jsx config
 * lets metadata tests `import { metadata } from '../app/.../page'` even
 * though those modules also export JSX bodies; esbuild compiles the JSX
 * with the React 17+ automatic runtime so React does not need to be in
 * scope at the call sites.
 */
export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
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
