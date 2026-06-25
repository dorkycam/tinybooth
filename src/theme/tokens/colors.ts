/**
 * Brand color tokens for TinyBooth.
 *
 * Mint and Lavender are the brand DNA, taken from the original app icon.
 * Mint is the dominant primary (the icon's outer field), Lavender is the
 * accent (the icon's lens). White is the breathing background.
 *
 * Source: docs/brand/identity.md section 3.
 */

/** Light-mode palette. */
export const LIGHT_COLORS = {
  /** Page background. Almost white with a faint mint tint so pages feel soft, not clinical. */
  paper: '#F4FBF9',
  /** Raised cards, photostrip border, soft surfaces. */
  cream: '#FFFFFF',
  /** Body text, wordmark, icons. */
  ink: '#1F2937',
  /** Captions, helper text. */
  graphite: '#5B6470',
  /** Dividers, input borders. */
  stone: '#D9E8E3',
  /** Primary brand color. The icon's outer field. */
  mint: '#7DD9C2',
  /** Mint pressed/active state. Slightly deeper for hover + dark text on mint. */
  mintDeep: '#4FB89C',
  /** Accent / CTA. The icon's lens. */
  lavender: '#D5A8E8',
  /** Lavender pressed/active state. */
  lavenderDeep: '#A878C9',
  /** Warm coral kept as a tertiary highlight (not primary anymore). Used for badges, labels. */
  coral: '#E85D5D',
} as const;

/** Dark-mode palette. Brand hues are lifted slightly so they read against Carbon. */
export const DARK_COLORS = {
  /** Warm carbon background; not pure black. */
  carbon: '#0F1216',
  /** Card/modal surface. */
  slate: '#181C22',
  /** Popovers, raised tiles. */
  slate2: '#21262E',
  /** Body text on dark surfaces. */
  cream: '#F4FBF9',
  /** Captions, metadata. */
  fog: '#A8AEB8',
  /** Hairline dividers. */
  hairline: '#2A2F37',
  /** Mint lifted for dark surfaces. */
  mint: '#8FE8D2',
  /** Mint deep for dark hover states. */
  mintDeep: '#5FCFB3',
  /** Lavender lifted for dark surfaces. */
  lavender: '#E0BAF1',
  /** Lavender deep for dark hover states. */
  lavenderDeep: '#B98DD9',
  /** Coral lifted for dark surfaces. */
  coral: '#FF7A6B',
} as const;

/** Combined token object grouped by mode. */
export const COLORS = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
} as const;

export type LightColorToken = keyof typeof LIGHT_COLORS;
export type DarkColorToken = keyof typeof DARK_COLORS;
