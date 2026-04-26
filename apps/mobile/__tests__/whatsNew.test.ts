/**
 * Tests for the what's new persistence helper. AsyncStorage is mocked with an
 * in-memory map so the helper can run under node without the native module.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    async getItem(key: string): Promise<string | null> {
      return memory.get(key) ?? null;
    },
    async setItem(key: string, value: string): Promise<void> {
      memory.set(key, value);
    },
    async removeItem(key: string): Promise<void> {
      memory.delete(key);
    },
  },
}));

import {
  markSeenVersion,
  readSeenVersion,
  resetWhatsNew,
  shouldShowWhatsNew,
} from '../src/lib/whatsNew';

beforeEach(async () => {
  memory.clear();
  await resetWhatsNew();
});

describe('shouldShowWhatsNew', () => {
  it('returns true on first call (nothing persisted)', async () => {
    expect(await shouldShowWhatsNew('1.0.0')).toBe(true);
  });

  it('returns false after the same version is marked seen', async () => {
    await markSeenVersion('1.0.0');
    expect(await shouldShowWhatsNew('1.0.0')).toBe(false);
  });

  it('returns true for a new version even if a previous one was seen', async () => {
    await markSeenVersion('1.0.0');
    expect(await shouldShowWhatsNew('1.1.0')).toBe(true);
  });

  it('readSeenVersion exposes the stored value', async () => {
    expect(await readSeenVersion()).toBeNull();
    await markSeenVersion('2.0.0');
    expect(await readSeenVersion()).toBe('2.0.0');
  });

  it('resetWhatsNew clears the stored value', async () => {
    await markSeenVersion('2.0.0');
    await resetWhatsNew();
    expect(await readSeenVersion()).toBeNull();
  });
});
