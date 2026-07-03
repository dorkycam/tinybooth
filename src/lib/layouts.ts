/**
 * Local strip-layout definitions and print-DPI geometry.
 *
 * v1 ships exactly two layouts (see CONTEXT.md): the Classic strip
 * (4 shots in two side-by-side columns, cut down the middle) and the Quad grid
 * (4 shots in a 2x2 grid). This file is the single source of truth for both the
 * layout identifiers and the canvas geometry the Skia bridge draws into.
 *
 * Geometry is computed at print resolution. The target sheet is a 4x6 photo at
 * 300 DPI (1200x1800 px), matching the AirPrint output. All functions here are
 * pure so they can be unit tested without the React Native or Skia runtime.
 */

/** The strip layouts TinyBooth can produce. v1: Classic and Quad. */
export type StripLayout = 'classic' | 'quad';

/**
 * A stored default-layout preference. Either a concrete {@link StripLayout} that
 * skips the picker, or `'ask'` (User's choice) to show the picker every session.
 */
export type LayoutPreference = StripLayout | 'ask';

/** Every shipped layout, in display order. */
export const STRIP_LAYOUTS: readonly StripLayout[] = ['classic', 'quad'] as const;

/** Default layout when none is set. */
export const DEFAULT_STRIP_LAYOUT: StripLayout = 'classic';

/** Default layout preference when none is set: ask the guest each session. */
export const DEFAULT_LAYOUT_PREFERENCE: LayoutPreference = 'ask';

/** Both v1 layouts capture four shots. */
export const SHOTS_PER_LAYOUT = 4;

/** Print canvas width in pixels: a 4x6 photo at 300 DPI is 1200 wide. */
export const CANVAS_WIDTH = 1200;

/** Print canvas height in pixels: a 4x6 photo at 300 DPI is 1800 tall. */
export const CANVAS_HEIGHT = 1800;

/** Even outer margin and inter-frame gap, in canvas pixels. */
export const CANVAS_MARGIN = 36;

/**
 * Middle gutter between the two Classic columns, in canvas pixels. Twice the
 * outer margin so that cutting the sheet down the centre leaves each half an
 * even border on all four sides, restoring the PhotoBerry 2018 proportion.
 */
export const CLASSIC_MIDDLE_GUTTER = CANVAS_MARGIN * 2;

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
 * Narrow an arbitrary value to a `LayoutPreference`, falling back to `'ask'`.
 *
 * Accepts the two concrete layouts plus the `'ask'` (User's choice) sentinel.
 * Any unrecognised value, including legacy or corrupt stored strings, resolves
 * to `'ask'` so the picker is shown rather than a wrong layout forced.
 *
 * @param value Candidate value (stored setting, route param, etc.).
 * @returns The matching `LayoutPreference`, or `'ask'` when unrecognised.
 */
export function parseLayoutPreference(value: unknown): LayoutPreference {
  if (value === 'ask') return 'ask';
  return parseStripLayout(typeof value === 'string' ? value : null) ?? 'ask';
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

/** A single frame rectangle on the strip canvas, in canvas pixels. */
export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A fully resolved layout: canvas size plus every rectangle to draw a shot into. */
export interface ResolvedLayout {
  /** Which layout this geometry belongs to. */
  id: StripLayout;
  /** Display label for the layout. */
  label: string;
  /** Number of distinct shots captured (always 4 in v1). */
  shotCount: number;
  /** The output canvas size in pixels (print DPI). */
  canvas: { width: number; height: number };
  /**
   * Every rectangle to draw a shot into, in draw order. For Classic this is the
   * 4 left-column rects followed by the 4 duplicated right-column rects (8 total
   * draws from 4 shots). For Quad it is the 4 grid cells.
   */
  frames: FrameRect[];
  /**
   * The single-cell aspect ratio (width / height) a shot is cropped to. The
   * capture screen uses this for its safe-crop overlay so guests see what will
   * land on the strip.
   */
  frameAspect: number;
}

/**
 * Resolve the Classic strip geometry.
 *
 * Four shots stacked in a column down the left half of the sheet, then the same
 * four duplicated into a matching right-half column. The result is two identical
 * strips on one 4x6 sheet, cut down the middle. White background, even outer
 * margins and row gaps, with a double-wide middle gutter so each cut half keeps
 * an even border on all four sides.
 *
 * @returns The resolved Classic layout (8 draw rects from 4 shots).
 */
export function resolveClassicLayout(): ResolvedLayout {
  const columns = 2;
  // Width available for the two columns after the two outer margins and the
  // wide middle gutter between them. The middle gutter is double the outer
  // margin so each cut half keeps an even border on all four sides.
  const usableWidth = CANVAS_WIDTH - CANVAS_MARGIN * 2 - CLASSIC_MIDDLE_GUTTER;
  const cellWidth = usableWidth / columns;
  // Four rows of shots in a column, with a margin above, below, and between each.
  const rows = SHOTS_PER_LAYOUT;
  const usableHeight = CANVAS_HEIGHT - CANVAS_MARGIN * (rows + 1);
  const cellHeight = usableHeight / rows;

  const leftX = CANVAS_MARGIN;
  const rightX = CANVAS_MARGIN + cellWidth + CLASSIC_MIDDLE_GUTTER;

  const frames: FrameRect[] = [];
  // Left column, top to bottom.
  for (let row = 0; row < rows; row += 1) {
    const y = CANVAS_MARGIN + row * (cellHeight + CANVAS_MARGIN);
    frames.push({ x: leftX, y, w: cellWidth, h: cellHeight });
  }
  // Right column duplicate, same rows.
  for (let row = 0; row < rows; row += 1) {
    const y = CANVAS_MARGIN + row * (cellHeight + CANVAS_MARGIN);
    frames.push({ x: rightX, y, w: cellWidth, h: cellHeight });
  }

  return {
    id: 'classic',
    label: stripLayoutLabel('classic'),
    shotCount: SHOTS_PER_LAYOUT,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    frames,
    frameAspect: cellWidth / cellHeight,
  };
}

/**
 * Resolve the Quad grid geometry.
 *
 * Four shots in a 2x2 grid filling the 4x6 sheet, white background, even margins
 * between every cell and the sheet edges.
 *
 * @returns The resolved Quad layout (4 draw rects from 4 shots).
 */
export function resolveQuadLayout(): ResolvedLayout {
  const columns = 2;
  const rows = 2;
  const usableWidth = CANVAS_WIDTH - CANVAS_MARGIN * (columns + 1);
  const usableHeight = CANVAS_HEIGHT - CANVAS_MARGIN * (rows + 1);
  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;

  const frames: FrameRect[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = CANVAS_MARGIN + col * (cellWidth + CANVAS_MARGIN);
      const y = CANVAS_MARGIN + row * (cellHeight + CANVAS_MARGIN);
      frames.push({ x, y, w: cellWidth, h: cellHeight });
    }
  }

  return {
    id: 'quad',
    label: stripLayoutLabel('quad'),
    shotCount: SHOTS_PER_LAYOUT,
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    frames,
    frameAspect: cellWidth / cellHeight,
  };
}

/**
 * Resolve the full print-DPI geometry for a layout.
 *
 * @param layout The layout to resolve.
 * @returns The resolved layout with canvas size and frame rects.
 */
export function resolveLayout(layout: StripLayout): ResolvedLayout {
  return layout === 'classic' ? resolveClassicLayout() : resolveQuadLayout();
}

/**
 * The single-cell aspect ratio (width / height) for a layout's safe-crop
 * overlay on the capture screen.
 *
 * @param layout The layout to measure.
 * @returns The width-to-height ratio of one shot cell.
 */
export function frameAspectForLayout(layout: StripLayout): number {
  return resolveLayout(layout).frameAspect;
}
