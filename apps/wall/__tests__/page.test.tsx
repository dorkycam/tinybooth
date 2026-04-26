import { describe, expect, it } from 'vitest';

/**
 * Phase 0 smoke test. Confirms the wall page module resolves the lilac accent
 * (the TinyWall sub-brand identity color). Phase 1 expands this to integration
 * tests against the real upload + slideshow flow.
 */
describe('wall homepage', () => {
  it('imports the lilac sub-brand accent', async () => {
    const tokens = await import('@tinybooth/ui-tokens');
    expect(tokens.LIGHT_COLORS.lilac).toBe('#B488D6');
  });
});
