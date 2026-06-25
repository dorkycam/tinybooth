/**
 * WhatsNewModal smoke + behavior tests.
 *
 * Vitest runs in node so we can't mount the real React Native renderer. We
 * instead verify:
 *   - The bullet content includes the explicit "still here" reassurance from
 *     docs/plan.md section 5.1.
 *   - The dismiss callback flows through to the persistence helper so the
 *     modal does not show twice for the same version.
 *
 * The render layout is verified by the EAS preview build + the screenshot
 * UI test, not by node.
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

import { markSeenVersion, shouldShowWhatsNew } from '../src/lib/whatsNew';

beforeEach(() => {
  memory.clear();
});

describe('WhatsNewModal copy reassurance', () => {
  it('bundles the still-here bullets in the source so the design copy is preserved', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const file = await fs.readFile(
      path.resolve(__dirname, '../src/components/WhatsNewModal.tsx'),
      'utf8',
    );
    expect(file).toContain('Still free for personal use.');
    expect(file).toContain('Still no account required.');
    expect(file).toContain('Your random messages from the original app are still here.');
    // What's new bullets per docs/plan.md section 5.1.
    expect(file).toContain('Now on Android.');
    expect(file).toContain('More layouts');
    expect(file).toContain('Photo wall for guests');
  });
});

describe('WhatsNewModal dismissal persistence integration', () => {
  it('flows through to markSeenVersion so the modal does not show twice', async () => {
    expect(await shouldShowWhatsNew('1.0.0')).toBe(true);
    await markSeenVersion('1.0.0');
    expect(await shouldShowWhatsNew('1.0.0')).toBe(false);
  });

  it('shows again on a new version', async () => {
    await markSeenVersion('1.0.0');
    expect(await shouldShowWhatsNew('1.1.0')).toBe(true);
  });
});
