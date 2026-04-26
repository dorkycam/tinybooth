/**
 * Tiny analytics wrapper. Behind `NEXT_PUBLIC_POSTHOG_KEY`. When the env
 * is absent, every call is a no-op. We do not actually load PostHog yet
 * (real wiring lands when Camrynn picks an analytics vendor); this
 * exposes the call site so product code can already start tracking
 * without hard-coding the vendor.
 *
 * Usage:
 *
 *   import { track } from '@/src/lib/analytics';
 *   track('cta_click', { label: 'Start a free wall', surface: 'home' });
 */

/** Property values we expect on a tracked event. Restrict to JSON-safe scalars. */
export type AnalyticsValue = string | number | boolean | null;

/** Property bag attached to an event. */
export type AnalyticsProps = Readonly<Record<string, AnalyticsValue>>;

/**
 * Whether analytics is configured. Reads the env variable at module load;
 * Next.js inlines `NEXT_PUBLIC_*` at build so this is safe to use in both
 * server and client bundles.
 */
const ENABLED = typeof process !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

/**
 * Track an event. No-op when analytics is not configured. Logs to the
 * console in development so the call site is debuggable.
 *
 * @param eventName Snake-cased event name.
 * @param props Optional property bag.
 */
export function track(eventName: string, props?: AnalyticsProps): void {
  if (!ENABLED) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('[analytics]', eventName, props ?? {});
    }
    return;
  }
  // Real implementation lands when the vendor is picked. See docs/plan.md.
}

/**
 * Identify a known user. Call after auth. No-op when analytics is not
 * configured.
 *
 * @param userId Stable user id.
 * @param traits Optional user traits.
 */
export function identify(userId: string, traits?: AnalyticsProps): void {
  if (!ENABLED) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('[analytics] identify', userId, traits ?? {});
    }
    return;
  }
  // Real implementation lands when the vendor is picked.
}
