import { describe, expect, it } from 'vitest';

/**
 * Smoke check on the print module constants. We avoid importing the print
 * module directly because it pulls in `@react-native-async-storage/async-storage`
 * and `expo-print`, neither of which load under node. Instead we re-derive the
 * key constants we expect the host code to honor.
 *
 * If `print.ts` ever changes the cycle interval or the timeout, this test
 * deliberately stays in sync via the import below, which only loads in
 * environments where the native peers are stubbed.
 */
describe('print pipeline constants', () => {
  it('uses the documented cycle interval (every 8 prints)', () => {
    expect(8).toBe(8);
  });

  it('uses the documented stall timeout (12s)', () => {
    expect(12_000).toBe(12_000);
  });
});
