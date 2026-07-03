import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Settings persistence tests. AsyncStorage's native module does not load in a
 * node test, so we mock it with a plain in-memory map and verify the parse and
 * round-trip behavior, with focus on the new idle-reset setting.
 */
const store = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    async multiGet(keys: string[]): Promise<Array<[string, string | null]>> {
      return keys.map((key) => [key, store.get(key) ?? null]);
    },
    async multiSet(pairs: Array<[string, string]>): Promise<void> {
      for (const [key, value] of pairs) store.set(key, value);
    },
  },
}));

import {
  DEFAULT_SESSION_SETTINGS,
  IDLE_RESET_CHOICES,
  loadSessionSettings,
  saveSessionSettings,
} from '../src/lib/sessionSettings';

describe('session settings idle reset', () => {
  beforeEach(() => {
    store.clear();
  });

  it('defaults idleReset to 30 seconds', async () => {
    expect(DEFAULT_SESSION_SETTINGS.idleReset).toBe(30);
    const loaded = await loadSessionSettings();
    expect(loaded.idleReset).toBe(30);
  });

  it('offers 15, 30, 60, and never as choices', () => {
    expect(IDLE_RESET_CHOICES).toEqual([15, 30, 60, 'never']);
  });

  it('round-trips a numeric idle reset', async () => {
    await saveSessionSettings({ idleReset: 60 });
    const loaded = await loadSessionSettings();
    expect(loaded.idleReset).toBe(60);
  });

  it('round-trips the never value', async () => {
    await saveSessionSettings({ idleReset: 'never' });
    const loaded = await loadSessionSettings();
    expect(loaded.idleReset).toBe('never');
  });

  it('falls back to the default for a junk stored value', async () => {
    store.set('@tinybooth/settings/idleReset', '999');
    const loaded = await loadSessionSettings();
    expect(loaded.idleReset).toBe(DEFAULT_SESSION_SETTINGS.idleReset);
  });
});

describe('session settings layout preference', () => {
  beforeEach(() => {
    store.clear();
  });

  it("defaults layout to 'ask' (User's choice)", async () => {
    expect(DEFAULT_SESSION_SETTINGS.layout).toBe('ask');
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('ask');
  });

  it("round-trips the 'ask' preference", async () => {
    await saveSessionSettings({ layout: 'ask' });
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('ask');
  });

  it('round-trips a concrete classic layout', async () => {
    await saveSessionSettings({ layout: 'classic' });
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('classic');
  });

  it('round-trips a concrete quad layout', async () => {
    await saveSessionSettings({ layout: 'quad' });
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('quad');
  });

  it("keeps a legacy stored concrete value valid without migration", async () => {
    store.set('@tinybooth/settings/layout', 'quad');
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('quad');
  });

  it("falls back to 'ask' for a junk stored value", async () => {
    store.set('@tinybooth/settings/layout', 'triptych');
    const loaded = await loadSessionSettings();
    expect(loaded.layout).toBe('ask');
  });
});
