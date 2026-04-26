import { describe, expect, it } from 'vitest';
import {
  FRAME_COUNTS,
  computeLayout,
  frameCountForLayout,
  type LayoutResult,
} from '../src/layout';
import type { StripLayout } from '@tinybooth/api-types';

const ALL_LAYOUTS: StripLayout[] = ['1x4_classic', '2x2', '1x3', 'single', '1x6_double'];

describe('FRAME_COUNTS', () => {
  it('lists every layout', () => {
    for (const layout of ALL_LAYOUTS) {
      expect(FRAME_COUNTS[layout]).toBeGreaterThan(0);
    }
  });

  it('matches the canonical capture counts', () => {
    expect(FRAME_COUNTS).toEqual({
      '1x4_classic': 4,
      '2x2': 4,
      '1x3': 3,
      single: 1,
      '1x6_double': 6,
    });
  });
});

describe('frameCountForLayout', () => {
  it('returns the same numbers as the FRAME_COUNTS table', () => {
    for (const layout of ALL_LAYOUTS) {
      expect(frameCountForLayout(layout)).toBe(FRAME_COUNTS[layout]);
    }
  });
});

describe('computeLayout', () => {
  it.each(ALL_LAYOUTS)('returns %s with the right frame count', (layout) => {
    const result = computeLayout(layout);
    expect(result.layout).toBe(layout);
    expect(result.frames).toHaveLength(FRAME_COUNTS[layout]);
  });

  it('keeps the 1x4 classic canvas at 800x1200 to match the Swift original', () => {
    const result = computeLayout('1x4_classic');
    expect(result.canvas).toEqual({ w: 800, h: 1200 });
  });

  it('places 1x4 classic frames in two columns of two with the 30px margin', () => {
    const result = computeLayout('1x4_classic');
    // Column 0 frames share the same x; column 1 frames share another x.
    const xs = new Set(result.frames.map((f) => f.x));
    expect(xs.size).toBe(2);
    // First two frames are column 0; their y values are the two row positions.
    const col0 = result.frames.filter((f) => f.x === Math.min(...xs));
    expect(col0).toHaveLength(2);
    expect(col0[0]?.y).toBe(30);
    expect(col0[1]?.y).toBeGreaterThan(col0[0]?.y ?? 0);
  });

  it('every layout reserves a watermark band at the bottom', () => {
    for (const layout of ALL_LAYOUTS) {
      const result = computeLayout(layout);
      expect(result.watermark.y).toBeGreaterThan(0);
      expect(result.watermark.y + result.watermark.h).toBeLessThanOrEqual(result.canvas.h);
      expect(result.watermark.text).toBe('tinybooth.com');
    }
  });

  it('honors a custom watermark text override', () => {
    const result = computeLayout('1x4_classic', { watermarkText: 'sams30th.com' });
    expect(result.watermark.text).toBe('sams30th.com');
  });

  it('every frame is fully inside the canvas', () => {
    for (const layout of ALL_LAYOUTS) {
      const result = computeLayout(layout);
      assertFramesInsideCanvas(result);
    }
  });

  it('frames do not overlap each other', () => {
    for (const layout of ALL_LAYOUTS) {
      const result = computeLayout(layout);
      assertNoFrameOverlap(result);
    }
  });

  it('returns positive width and height for every frame and the watermark', () => {
    for (const layout of ALL_LAYOUTS) {
      const result = computeLayout(layout);
      for (const frame of result.frames) {
        expect(frame.w).toBeGreaterThan(0);
        expect(frame.h).toBeGreaterThan(0);
      }
      expect(result.watermark.w).toBeGreaterThan(0);
      expect(result.watermark.h).toBeGreaterThan(0);
    }
  });

  it('throws on an unknown layout', () => {
    // @ts-expect-error -- intentional bad input to exercise the exhaustive guard.
    expect(() => computeLayout('not_a_layout')).toThrow(/Unknown layout/);
  });

  it('places single layout with one full-width frame', () => {
    const result = computeLayout('single');
    expect(result.frames).toHaveLength(1);
    const frame = result.frames[0];
    expect(frame).toBeDefined();
    if (!frame) return;
    expect(frame.x).toBe(30);
    expect(frame.w).toBe(result.canvas.w - 60);
  });

  it('places 1x3 frames in a single column', () => {
    const result = computeLayout('1x3');
    const xs = new Set(result.frames.map((f) => f.x));
    expect(xs.size).toBe(1);
  });

  it('places 1x6_double frames across two columns', () => {
    const result = computeLayout('1x6_double');
    const xs = new Set(result.frames.map((f) => f.x));
    expect(xs.size).toBe(2);
    expect(result.frames).toHaveLength(6);
  });

  it('places 2x2 frames at four distinct positions', () => {
    const result = computeLayout('2x2');
    const positions = new Set(result.frames.map((f) => `${f.x},${f.y}`));
    expect(positions.size).toBe(4);
  });
});

function assertFramesInsideCanvas(result: LayoutResult): void {
  for (const frame of result.frames) {
    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.w).toBeLessThanOrEqual(result.canvas.w);
    expect(frame.y + frame.h).toBeLessThanOrEqual(result.canvas.h);
  }
}

describe('computeLayout with branding', () => {
  it('emits a footer slot of kind logo when branding.logoUrl is present', () => {
    const result = computeLayout('1x4_classic', {
      branding: { logoUrl: 'https://cdn.example.com/logo.png', primaryColor: '#FF00AA' },
    });
    expect(result.footer).toBeDefined();
    expect(result.footer?.kind).toBe('logo');
    expect(result.footer?.logoUrl).toBe('https://cdn.example.com/logo.png');
    expect(result.branding?.primaryColor).toBe('#FF00AA');
  });

  it('emits a footer slot of kind watermark when branding has colors only', () => {
    const result = computeLayout('2x2', {
      branding: { primaryColor: '#FF00AA', accentColor: '#00FFAA' },
    });
    expect(result.footer?.kind).toBe('watermark');
    expect(result.footer?.text).toBe('tinybooth.com');
  });

  it('honors the watermarkText override inside the branded footer', () => {
    const result = computeLayout('single', {
      watermarkText: 'sams30th.com',
      branding: { primaryColor: '#000' },
    });
    expect(result.footer?.text).toBe('sams30th.com');
  });

  it('returns no footer when branding is absent (backwards compatible)', () => {
    const result = computeLayout('1x4_classic');
    expect(result.footer).toBeUndefined();
    expect(result.branding).toBeUndefined();
  });

  it('footer rect matches the watermark band rect exactly', () => {
    const result = computeLayout('1x4_classic', { branding: { logoUrl: 'http://x' } });
    expect(result.footer?.x).toBe(result.watermark.x);
    expect(result.footer?.y).toBe(result.watermark.y);
    expect(result.footer?.w).toBe(result.watermark.w);
    expect(result.footer?.h).toBe(result.watermark.h);
  });
});

function assertNoFrameOverlap(result: LayoutResult): void {
  for (let i = 0; i < result.frames.length; i += 1) {
    for (let j = i + 1; j < result.frames.length; j += 1) {
      const a = result.frames[i];
      const b = result.frames[j];
      if (!a || !b) continue;
      const overlapsX = a.x < b.x + b.w && b.x < a.x + a.w;
      const overlapsY = a.y < b.y + b.h && b.y < a.y + a.h;
      expect(overlapsX && overlapsY).toBe(false);
    }
  }
}
