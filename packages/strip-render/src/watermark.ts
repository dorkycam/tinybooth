/**
 * Watermark text + visibility helpers shared by both render backends.
 *
 * The watermark band is part of every layout (see `layout.ts`). What changes
 * is the text inside the band and whether the band renders at all. Free strips
 * show the `tinybooth.com` wordmark. Paid (entitlement-true) strips hide the
 * watermark entirely and recover that vertical space at composition time.
 */

import type { StripLayout } from '@tinybooth/api-types';

/** Caller-provided entitlement state. */
export interface EntitlementState {
  /** True when the user holds an active strip-unlock or event-pass entitlement. */
  stripUnlock: boolean;
}

/** Optional event branding override (paid hosts swap the watermark text). */
export interface BrandingOverride {
  /** Display text shown in place of `tinybooth.com`. */
  text?: string;
}

/** Result of resolving a watermark for a given render context. */
export interface WatermarkResolution {
  /** Whether the watermark band should be drawn at all. */
  visible: boolean;
  /** Text to render. Empty string when `visible === false`. */
  text: string;
}

/** Default text shown on free strips. */
export const DEFAULT_WATERMARK_TEXT = 'tinybooth.com';

/**
 * Decide whether to render the watermark band and what text to show.
 *
 * The band only disappears when the user holds an entitlement AND no branding
 * override is supplied. If branding is supplied, the band stays (with the
 * host's text) regardless of entitlement, so the strip always reserves that
 * footer area for credits.
 *
 * @param entitlements Current entitlement state.
 * @param branding Optional branding override from the event host.
 * @returns Visibility + text to render in the watermark band.
 */
export function resolveWatermark(
  entitlements: EntitlementState,
  branding: BrandingOverride = {},
): WatermarkResolution {
  if (branding.text && branding.text.trim().length > 0) {
    return { visible: true, text: branding.text.trim() };
  }
  if (entitlements.stripUnlock) {
    return { visible: false, text: '' };
  }
  return { visible: true, text: DEFAULT_WATERMARK_TEXT };
}

/**
 * Convenience helper used by call sites that already know which layout they
 * are rendering. Kept as a separate function so future layouts can opt out of
 * the watermark band entirely (e.g. a true-bleed art print).
 *
 * @param layout Strip layout the watermark is being rendered for.
 * @param entitlements Current entitlement state.
 * @param branding Optional branding override.
 */
export function watermarkForLayout(
  layout: StripLayout,
  entitlements: EntitlementState,
  branding: BrandingOverride = {},
): WatermarkResolution {
  // Single-photo postcards always render with the watermark band so we have
  // a consistent corner credit even on the largest canvas.
  void layout;
  return resolveWatermark(entitlements, branding);
}
