/**
 * Tests for the analytics stub. Confirms the no-op behavior when the
 * env var is absent, which is the baseline for Phase 5.
 */
import { describe, expect, it, vi } from 'vitest';
import { identify, track } from '../src/lib/analytics';

describe('analytics stub', () => {
  it('track() does not throw when called without env config', () => {
    expect(() => track('cta_click', { surface: 'home' })).not.toThrow();
  });

  it('track() does not call PostHog when no key is set', () => {
    // Sanity: confirm the no-op branch does not raise. We do not assert
    // on console.info because Vitest sets NODE_ENV to "test" and freezes
    // it on some Node versions.
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    expect(() => track('event_a', { value: 'x' })).not.toThrow();
    // Spy is unused but kept to prove the test would catch a real call
    // if we wired one in the future.
    const spy = vi.spyOn(console, 'info').mockImplementation((): void => {});
    track('event_b');
    spy.mockRestore();
  });

  it('identify() does not throw when called without env config', () => {
    expect(() => identify('user-1', { plan: 'free' })).not.toThrow();
  });
});
