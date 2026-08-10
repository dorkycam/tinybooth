import { describe, expect, it } from 'vitest';

import { COLORS, DARK_COLORS, LIGHT_COLORS } from '../src/theme/tokens/colors';
import { FONT_FAMILIES, FONT_WEIGHTS, TYPE_SCALE } from '../src/theme/tokens/typography';
import { RADIUS, SPACING } from '../src/theme/tokens/spacing';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

describe('colors', () => {
  it('exposes both light and dark palettes', () => {
    expect(COLORS.light).toBe(LIGHT_COLORS);
    expect(COLORS.dark).toBe(DARK_COLORS);
  });

  it('all light colors are 6-digit hex', () => {
    for (const value of Object.values(LIGHT_COLORS)) {
      expect(value).toMatch(HEX_PATTERN);
    }
  });

  it('all dark colors are 6-digit hex', () => {
    for (const value of Object.values(DARK_COLORS)) {
      expect(value).toMatch(HEX_PATTERN);
    }
  });

  it('uses faint mint paper, not pure white, for the light background', () => {
    expect(LIGHT_COLORS.paper).toBe('#F4FBF9');
    expect(LIGHT_COLORS.paper).not.toBe('#FFFFFF');
  });

  it('uses warm carbon, not pure black, for the dark background', () => {
    expect(DARK_COLORS.carbon).toBe('#0F1216');
    expect(DARK_COLORS.carbon).not.toBe('#000000');
  });

  it('promotes mint and lavender from the original app icon as primary brand colors', () => {
    expect(LIGHT_COLORS.mint).toBe('#7DD9C2');
    expect(LIGHT_COLORS.lavender).toBe('#D5A8E8');
  });

  it('keeps coral as a tertiary highlight', () => {
    expect(LIGHT_COLORS.coral).toBe('#E85D5D');
  });
});

describe('typography', () => {
  it('uses Manrope as the primary family', () => {
    expect(FONT_FAMILIES.primary).toContain('Manrope');
  });

  it('uses Caveat as the accent family', () => {
    expect(FONT_FAMILIES.accent).toContain('Caveat');
  });

  it('weight scale is monotonically increasing', () => {
    const weights = Object.values(FONT_WEIGHTS);
    for (let i = 1; i < weights.length; i += 1) {
      const prev = weights[i - 1];
      const curr = weights[i];
      if (prev !== undefined && curr !== undefined) {
        expect(curr).toBeGreaterThan(prev);
      }
    }
  });

  it('body size is at least 15px (tablet-first readability)', () => {
    expect(TYPE_SCALE.body.size).toBeGreaterThanOrEqual(15);
  });
});

describe('spacing', () => {
  it('all spacing values are non-negative integers on a 4-pt grid', () => {
    for (const value of Object.values(SPACING)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value % 4).toBe(0);
    }
  });

  it('exposes a pill radius for chips', () => {
    expect(RADIUS.pill).toBeGreaterThanOrEqual(999);
  });
});
