/**
 * Spacing tokens on a 4-pt scale.
 *
 * Use these tokens for padding, margin, and gap. Tablet-first defaults; phones
 * inherit unless explicitly overridden.
 */

/** 4-pt scale in pixels. */
export const SPACING = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xl2: 32,
  xl3: 48,
  xl4: 64,
  xl5: 96,
} as const;

export type SpacingToken = keyof typeof SPACING;

/** Border radius scale. */
export const RADIUS = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof RADIUS;
