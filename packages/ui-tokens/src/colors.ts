/**
 * Brand color tokens for TinyBooth.
 *
 * Cream + Ink anchors echo physical photo paper. Coral is the primary brand
 * accent. Mint and Lilac are supporting accents (Mint for TinyBooth-core,
 * Lilac for the TinyWall sub-brand).
 *
 * Source: docs/brand/identity.md section 3.
 */

/** Light-mode palette. */
export const LIGHT_COLORS = {
  /** Warm paper background. */
  paper: '#FBF7EE',
  /** Raised cards, photostrip border. */
  cream: '#F4EAD8',
  /** Body text, wordmark, icons. */
  ink: '#1F2937',
  /** Captions, helper text. */
  graphite: '#5B6470',
  /** Dividers, input borders. */
  stone: '#E5E0D5',
  /** Primary brand accent. */
  coral: '#E85D5D',
  /** Secondary accent (TinyBooth-core). */
  mint: '#5FBFA6',
  /** Tertiary accent (TinyWall sub-brand). */
  lilac: '#B488D6',
} as const;

/** Dark-mode palette. Accents are lifted slightly for contrast on Carbon. */
export const DARK_COLORS = {
  /** Warm carbon background; not pure black. */
  carbon: '#0F1216',
  /** Card/modal surface. */
  slate: '#181C22',
  /** Popovers, raised tiles. */
  slate2: '#21262E',
  /** Body text on dark surfaces. */
  cream: '#F4EAD8',
  /** Captions, metadata. */
  fog: '#A8AEB8',
  /** Hairline dividers. */
  hairline: '#2A2F37',
  /** Coral lifted for dark surfaces. */
  coral: '#FF7A6B',
  /** Mint lifted for dark surfaces. */
  mint: '#74D2B9',
  /** Lilac lifted for dark surfaces. */
  lilac: '#C9A4E8',
} as const;

/** Combined token object grouped by mode. */
export const COLORS = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
} as const;

export type LightColorToken = keyof typeof LIGHT_COLORS;
export type DarkColorToken = keyof typeof DARK_COLORS;
