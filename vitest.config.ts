import { defineConfig } from 'vitest/config';

/**
 * Vitest config for the mobile app. Node environment because we cannot boot
 * the React Native or Expo Router runtime here. Tests cover the pure modules
 * (layout class, session settings parsing) plus smoke imports of the screen
 * files via dynamic import that we mock heavy native deps for.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts', '__tests__/**/*.test.tsx'],
  },
});
