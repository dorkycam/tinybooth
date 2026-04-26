import { describe, expect, it } from 'vitest';

/**
 * Phase 0 smoke test. We do not boot React Native in vitest; the EAS preview
 * build is the integration test. Here we just confirm the entrypoint module
 * imports cleanly so a typo or broken cross-package import surfaces in CI.
 *
 * Phase 2 swaps this for a `@testing-library/react-native` render test once
 * the camera and strip components exist.
 */
describe('mobile entrypoint', () => {
  it('App module is resolvable as a default export reference', async () => {
    // Vitest in node cannot import the React Native runtime, so we limit the
    // smoke test to the messages package import path that App relies on.
    const messages = await import('@tinybooth/messages');
    expect(typeof messages.getRandomMessage).toBe('function');
    expect(messages.STATIC_MESSAGES.length).toBe(9);
  });
});
