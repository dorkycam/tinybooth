/**
 * Entitlement hook stub. Phase 2 ships with no purchases wired up; the hook
 * always returns `false`. Phase 4 will replace this implementation with a
 * RevenueCat-backed lookup, keeping the call signature intact.
 */

/** Known entitlement keys. */
export type EntitlementKey = 'strip_unlock' | 'event_pass' | 'event_pass_plus';

/**
 * Returns whether the user holds the entitlement. Phase 2 placeholder always
 * returns false. Phase 4 swaps to the RevenueCat client.
 *
 * @param key Entitlement key to check.
 */
export function useEntitlement(key: EntitlementKey): boolean {
  // Reference the parameter so the linter does not flag it as unused; this is
  // the call signature future code consumes.
  void key;
  return false;
}
