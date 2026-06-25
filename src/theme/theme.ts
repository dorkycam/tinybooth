/**
 * Mobile theme bridge. Maps the local brand tokens into the shape the RN app
 * uses everyday: paired light/dark color objects, font scale tuned for tablets,
 * and a couple of helper functions for shadows and elevation.
 *
 * Component code should import `useTheme()` (defined in `useTheme.ts`) instead
 * of reading from this file directly so dark-mode swaps stay automatic.
 */
import {
  DARK_COLORS,
  FONT_FAMILIES,
  LIGHT_COLORS,
  RADIUS,
  SPACING,
  TYPE_SCALE,
} from './tokens';

/** Resolved colors for one mode. */
export interface ThemeColors {
  bg: string;
  surface: string;
  fg: string;
  subtle: string;
  hairline: string;
  /** Primary brand color (mint, from the original app icon). */
  primary: string;
  primaryDeep: string;
  /** Accent / CTA color (lavender, from the original app icon's lens). */
  accent: string;
  accentDeep: string;
  /** Tertiary highlight (coral). Use sparingly for badges or warnings. */
  highlight: string;
}

const lightColors: ThemeColors = {
  bg: LIGHT_COLORS.paper,
  surface: LIGHT_COLORS.cream,
  fg: LIGHT_COLORS.ink,
  subtle: LIGHT_COLORS.graphite,
  hairline: LIGHT_COLORS.stone,
  primary: LIGHT_COLORS.mint,
  primaryDeep: LIGHT_COLORS.mintDeep,
  accent: LIGHT_COLORS.lavender,
  accentDeep: LIGHT_COLORS.lavenderDeep,
  highlight: LIGHT_COLORS.coral,
};

const darkColors: ThemeColors = {
  bg: DARK_COLORS.carbon,
  surface: DARK_COLORS.slate,
  fg: DARK_COLORS.cream,
  subtle: DARK_COLORS.fog,
  hairline: DARK_COLORS.hairline,
  primary: DARK_COLORS.mint,
  primaryDeep: DARK_COLORS.mintDeep,
  accent: DARK_COLORS.lavender,
  accentDeep: DARK_COLORS.lavenderDeep,
  highlight: DARK_COLORS.coral,
};

/** Mode keys. */
export type ThemeMode = 'light' | 'dark';

/** Combined theme object passed to component styles. */
export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  type: typeof TYPE_SCALE;
  fontFamily: typeof FONT_FAMILIES;
}

/**
 * Build a Theme for the requested mode.
 *
 * @param mode 'light' or 'dark'.
 */
export function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkColors : lightColors,
    spacing: SPACING,
    radius: RADIUS,
    type: TYPE_SCALE,
    fontFamily: FONT_FAMILIES,
  };
}
