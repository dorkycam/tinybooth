/**
 * Entitlement hook backed by the IAP wrapper.
 *
 * Phase 4 replaces the Phase 2 placeholder. The hook subscribes to the
 * customer-info snapshot via `getCustomerInfo()` and re-reads on demand. In
 * stub mode the snapshot reflects whatever Strip Unlock / Event Pass
 * entitlements have been written via `purchase()`.
 *
 * Usage:
 *   const stripUnlocked = useEntitlement('strip_unlock');
 */
import { useEffect, useState, useCallback } from 'react';
import type { EntitlementKey } from '@tinybooth/billing';
import { getCustomerInfo } from '@/lib/iap';

/** Re-export for convenience so callers don't need a second import. */
export type { EntitlementKey } from '@tinybooth/billing';

/**
 * Returns whether the user holds the named entitlement. Re-reads on focus and
 * on the lazy `refresh` callback the hook returns alongside the boolean.
 *
 * @param key Entitlement key.
 */
export function useEntitlement(key: EntitlementKey): boolean {
  const { active } = useEntitlementSnapshot();
  return active.has(key);
}

interface EntitlementSnapshotHook {
  /** Set of all currently-active entitlement keys. */
  active: Set<EntitlementKey>;
  /** True until the first read resolves. */
  loading: boolean;
  /** Force a re-read of customer info. */
  refresh(): Promise<void>;
}

/**
 * Read the full set of active entitlements. Useful when a screen needs to
 * branch on more than one key (e.g. the upgrade page).
 */
export function useEntitlementSnapshot(): EntitlementSnapshotHook {
  const [active, setActive] = useState<Set<EntitlementKey>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    const info = await getCustomerInfo();
    setActive(info.activeEntitlements);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { active, loading, refresh };
}
