/**
 * Pure tablet/phone classification helpers. Separated from `layout.ts` so
 * tests can import this without pulling in `react-native`.
 */

/** Possible layout classes. */
export type LayoutClass = 'phone' | 'tablet';

/** Width threshold (in DP / points) at which we switch to the tablet layout. */
export const TABLET_BREAKPOINT = 768;

/** Possible orientations. */
export type Orientation = 'portrait' | 'landscape';

/**
 * Screen arrangement family. `stacked` centers a narrow content column (phone in
 * either orientation, plus tablet portrait); `wide` is tablet landscape only and
 * uses the same arrangement with a wider content column.
 */
export type Presentation = 'stacked' | 'wide';

/** Max content-column width (in DP) per presentation. */
export const CONTENT_MAX_WIDTH = {
  stacked: 480,
  wide: 640,
} as const;

/** Combined layout descriptor returned by `useLayoutClass`. */
export interface LayoutDescriptor {
  layoutClass: LayoutClass;
  orientation: Orientation;
  presentation: Presentation;
  width: number;
  height: number;
}

/**
 * Classify dimensions into a layout class + orientation.
 *
 * @param width Window width in DP.
 * @param height Window height in DP.
 */
export function classifyDimensions(width: number, height: number): LayoutDescriptor {
  const shortEdge = Math.min(width, height);
  const orientation: Orientation = width >= height ? 'landscape' : 'portrait';
  const layoutClass: LayoutClass = shortEdge >= TABLET_BREAKPOINT ? 'tablet' : 'phone';
  const presentation: Presentation =
    layoutClass === 'tablet' && orientation === 'landscape' ? 'wide' : 'stacked';
  return { layoutClass, orientation, presentation, width, height };
}
