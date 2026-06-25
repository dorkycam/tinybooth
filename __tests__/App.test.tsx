import { describe, expect, it } from 'vitest';

import { LIGHT_COLORS } from '../src/theme/tokens/colors';

/**
 * Mobile entrypoint smoke test. Vitest in node cannot boot the React Native or
 * Expo Router runtime, so we limit verification to the pure modules the app
 * relies on. The full UI test plan is the dev build.
 */
describe('mobile brand tokens', () => {
  it('loads the inlined brand color tokens', () => {
    expect(LIGHT_COLORS.coral).toBe('#E85D5D');
  });
});
