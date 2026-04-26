import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WATERMARK_TEXT,
  resolveWatermark,
  watermarkForLayout,
} from '../src/watermark';

describe('resolveWatermark', () => {
  it('returns the default text when the user has no entitlement and no branding', () => {
    const result = resolveWatermark({ stripUnlock: false });
    expect(result).toEqual({ visible: true, text: DEFAULT_WATERMARK_TEXT });
  });

  it('hides the watermark when the user holds a strip-unlock entitlement', () => {
    const result = resolveWatermark({ stripUnlock: true });
    expect(result).toEqual({ visible: false, text: '' });
  });

  it('uses the branding override even when the user is entitled', () => {
    const result = resolveWatermark({ stripUnlock: true }, { text: "Sam's 30th" });
    expect(result).toEqual({ visible: true, text: "Sam's 30th" });
  });

  it('uses the branding override when the user is not entitled', () => {
    const result = resolveWatermark({ stripUnlock: false }, { text: 'Wedding 2026' });
    expect(result).toEqual({ visible: true, text: 'Wedding 2026' });
  });

  it('treats a whitespace-only branding text as no override', () => {
    const result = resolveWatermark({ stripUnlock: false }, { text: '   ' });
    expect(result.text).toBe(DEFAULT_WATERMARK_TEXT);
  });

  it('trims branding whitespace', () => {
    const result = resolveWatermark({ stripUnlock: false }, { text: '  hello  ' });
    expect(result.text).toBe('hello');
  });
});

describe('watermarkForLayout', () => {
  it('matches resolveWatermark for every supported layout', () => {
    const layouts = ['1x4_classic', '2x2', '1x3', 'single', '1x6_double'] as const;
    for (const layout of layouts) {
      const direct = resolveWatermark({ stripUnlock: false });
      const indirect = watermarkForLayout(layout, { stripUnlock: false });
      expect(indirect).toEqual(direct);
    }
  });

  it('respects branding overrides per layout', () => {
    const result = watermarkForLayout('2x2', { stripUnlock: true }, { text: 'host text' });
    expect(result.visible).toBe(true);
    expect(result.text).toBe('host text');
  });
});
