/**
 * Typography tokens for TinyBooth.
 *
 * Manrope is the primary family (UI + display + body). Caveat is reserved for
 * the random post-photo message and event captions on share images. Source:
 * docs/brand/identity.md section 4.
 */

/** Font family stacks. */
export const FONT_FAMILIES = {
  /** Primary UI + display family. */
  primary: 'Manrope, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  /** Handwriting accent for random messages and captions. */
  accent: 'Caveat, "Segoe Script", "Bradley Hand", cursive',
  /** Monospace for event codes and share URLs. */
  mono: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
} as const;

/** Manrope weight axis we ship. */
export const FONT_WEIGHTS = {
  body: 500,
  ui: 600,
  display: 700,
  hero: 800,
} as const;

/** Tablet-first type scale. Sizes/line-heights in pixels. */
export const TYPE_SCALE = {
  displayXl: { size: 56, lineHeight: 60, weight: FONT_WEIGHTS.display },
  displayLg: { size: 40, lineHeight: 48, weight: FONT_WEIGHTS.display },
  h1: { size: 32, lineHeight: 40, weight: FONT_WEIGHTS.display },
  h2: { size: 24, lineHeight: 32, weight: FONT_WEIGHTS.ui },
  h3: { size: 18, lineHeight: 24, weight: FONT_WEIGHTS.ui },
  body: { size: 17, lineHeight: 24, weight: FONT_WEIGHTS.body },
  bodySm: { size: 15, lineHeight: 20, weight: FONT_WEIGHTS.body },
  caption: { size: 13, lineHeight: 16, weight: FONT_WEIGHTS.body },
  mono: { size: 13, lineHeight: 16, weight: FONT_WEIGHTS.body },
} as const;

export type TypeScaleToken = keyof typeof TYPE_SCALE;
