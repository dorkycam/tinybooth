/**
 * Photostrip layout identifiers. Match the Skia layouts under
 * `packages/strip-render` (added in Phase 2).
 */
export type StripLayout = '1x4_classic' | '2x2' | '1x3' | 'single' | '1x6_double';

/**
 * Strip is a rendered TinyBooth photostrip. Standalone strips (no event tied)
 * never upload to the cloud and have `eventId = null`.
 */
export interface Strip {
  id: string;
  eventId: string | null;
  layout: StripLayout;
  watermarkRemoved: boolean;
  igShareUrl: string | null;
  createdAt: string;
}
