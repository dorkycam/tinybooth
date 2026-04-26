import { describe, expect, it } from 'vitest';

/**
 * Mobile entrypoint smoke test. Vitest in node cannot boot the React Native or
 * Expo Router runtime, so we limit verification to cross-package imports the
 * mobile app relies on. The full UI test plan is the EAS preview build.
 */
describe('mobile cross-package imports', () => {
  it('loads the random message library', async () => {
    const messages = await import('@tinybooth/messages');
    expect(typeof messages.getRandomMessage).toBe('function');
    expect(messages.STATIC_MESSAGES.length).toBe(9);
  });

  it('loads strip layout math from the shared package', async () => {
    const stripRender = await import('@tinybooth/strip-render');
    expect(typeof stripRender.computeLayout).toBe('function');
    expect(stripRender.frameCountForLayout('1x4_classic')).toBe(4);
  });

  it('loads brand color tokens', async () => {
    const tokens = await import('@tinybooth/ui-tokens');
    expect(tokens.LIGHT_COLORS.coral).toBe('#E85D5D');
  });
});
