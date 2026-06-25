/**
 * Local strip-layout definitions.
 *
 * Replaces the strip types that used to live in the archived SaaS packages.
 * v1 ships exactly two layouts (see CONTEXT.md): the Classic strip
 * (4 shots in two side-by-side columns) and the Quad grid (4 shots, 2x2).
 *
 * Phase 2 fills in the canvas geometry (print DPI, frame rects, crop math).
 * For now this file is the single source of truth for the layout identifiers
 * so the screens and settings can typecheck without the SaaS packages.
 */

/** The strip layouts TinyBooth can produce. v1: Classic and Quad. */
export type StripLayout = 'classic' | 'quad';

/** Every shipped layout, in display order. */
export const STRIP_LAYOUTS: readonly StripLayout[] = ['classic', 'quad'] as const;

/** Default layout when none is set. */
export const DEFAULT_STRIP_LAYOUT: StripLayout = 'classic';

/** Both v1 layouts capture four shots. */
export const SHOTS_PER_LAYOUT = 4;

/**
 * Narrow an arbitrary string to a `StripLayout`, or return null.
 *
 * @param value Candidate string (route param, stored setting, etc.).
 * @returns The matching `StripLayout`, or null when unrecognised.
 */
export function parseStripLayout(value: string | null | undefined): StripLayout | null {
  return value === 'classic' || value === 'quad' ? value : null;
}

/**
 * Human-readable name for a layout.
 *
 * @param layout The layout to label.
 * @returns A short title shown in the UI.
 */
export function stripLayoutLabel(layout: StripLayout): string {
  return layout === 'classic' ? 'Classic strip' : 'Quad grid';
}

/**
 * Number of shots a layout captures. Both v1 layouts capture four.
 *
 * @param _layout The layout (unused in v1; both are four shots).
 * @returns The shot count.
 */
export function shotCountForLayout(_layout: StripLayout): number {
  return SHOTS_PER_LAYOUT;
}
