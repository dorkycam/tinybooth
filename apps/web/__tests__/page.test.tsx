import { describe, expect, it } from 'vitest';

/**
 * Phase 0 smoke test. Confirms the page module resolves and the cross-package
 * token import does not blow up. Phase 5 replaces this with a full RTL render
 * suite once the marketing components exist.
 */
describe('web homepage', () => {
  it('imports brand tokens', async () => {
    const tokens = await import('@tinybooth/ui-tokens');
    expect(tokens.LIGHT_COLORS.paper).toBe('#FBF7EE');
  });
});
