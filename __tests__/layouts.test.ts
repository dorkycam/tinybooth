import { describe, expect, it } from 'vitest';
import {
  CANVAS_HEIGHT,
  CANVAS_MARGIN,
  CANVAS_WIDTH,
  CLASSIC_MIDDLE_GUTTER,
  DEFAULT_LAYOUT_PREFERENCE,
  DEFAULT_STRIP_LAYOUT,
  SHOTS_PER_LAYOUT,
  STRIP_LAYOUTS,
  frameAspectForLayout,
  parseLayoutPreference,
  parseStripLayout,
  resolveClassicLayout,
  resolveLayout,
  resolveQuadLayout,
  shotCountForLayout,
  stripLayoutLabel,
  type FrameRect,
} from '../src/lib/layouts';

/** Return the rect at `index`, failing the test if it is missing. */
function frameAt(frames: FrameRect[], index: number): FrameRect {
  const rect = frames[index];
  if (!rect) throw new Error(`expected a frame at index ${index}`);
  return rect;
}

/** Assert a rect sits fully inside the print canvas. */
function expectInsideCanvas(rect: FrameRect): void {
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.w).toBeGreaterThan(0);
  expect(rect.h).toBeGreaterThan(0);
  expect(rect.x + rect.w).toBeLessThanOrEqual(CANVAS_WIDTH);
  expect(rect.y + rect.h).toBeLessThanOrEqual(CANVAS_HEIGHT);
}

describe('layout identifiers', () => {
  it('ships exactly the two v1 layouts in display order', () => {
    expect(STRIP_LAYOUTS).toEqual(['classic', 'quad']);
  });

  it('defaults to the classic strip', () => {
    expect(DEFAULT_STRIP_LAYOUT).toBe('classic');
  });

  it('parses known layouts and rejects everything else', () => {
    expect(parseStripLayout('classic')).toBe('classic');
    expect(parseStripLayout('quad')).toBe('quad');
    expect(parseStripLayout('grid')).toBeNull();
    expect(parseStripLayout(null)).toBeNull();
    expect(parseStripLayout(undefined)).toBeNull();
  });

  it('labels both layouts', () => {
    expect(stripLayoutLabel('classic')).toBe('Classic strip');
    expect(stripLayoutLabel('quad')).toBe('Quad grid');
  });

  it('reports four shots for every layout', () => {
    expect(SHOTS_PER_LAYOUT).toBe(4);
    expect(shotCountForLayout('classic')).toBe(4);
    expect(shotCountForLayout('quad')).toBe(4);
  });
});

describe('classic strip geometry', () => {
  const layout = resolveClassicLayout();

  it('captures four shots but draws eight rects (two duplicated columns)', () => {
    expect(layout.shotCount).toBe(4);
    expect(layout.frames).toHaveLength(8);
  });

  it('sizes the canvas for a 4x6 print at 300 DPI', () => {
    expect(layout.canvas).toEqual({ width: 1200, height: 1800 });
  });

  it('keeps every frame inside the canvas', () => {
    for (const rect of layout.frames) {
      expectInsideCanvas(rect);
    }
  });

  it('duplicates the left column into a matching right column', () => {
    for (let i = 0; i < 4; i += 1) {
      const left = frameAt(layout.frames, i);
      const right = frameAt(layout.frames, i + 4);
      expect(right.y).toBe(left.y);
      expect(right.w).toBe(left.w);
      expect(right.h).toBe(left.h);
      expect(right.x).toBeGreaterThan(left.x);
    }
  });

  it('exposes a frame aspect matching the cell rects', () => {
    const cell = frameAt(layout.frames, 0);
    expect(layout.frameAspect).toBeCloseTo(cell.w / cell.h);
    expect(frameAspectForLayout('classic')).toBeCloseTo(layout.frameAspect);
  });

  it('sizes the middle gutter at twice the outer margin', () => {
    // CANVAS_MARGIN = 36 -> gutter = 72.
    expect(CLASSIC_MIDDLE_GUTTER).toBe(2 * CANVAS_MARGIN);
    const left = frameAt(layout.frames, 0);
    const right = frameAt(layout.frames, 4);
    // Gutter is the space between the right edge of the left column and the left
    // edge of the right column: 636 - (36 + 528) = 72.
    const gutter = right.x - (left.x + left.w);
    expect(gutter).toBe(2 * CANVAS_MARGIN);
    expect(gutter).toBe(72);
  });

  it('leaves an even 36px border on every side of each cut half', () => {
    // The sheet is cut in half down the middle at x = 600.
    const cutX = CANVAS_WIDTH / 2;
    expect(cutX).toBe(600);
    const left = frameAt(layout.frames, 0);
    const right = frameAt(layout.frames, 4);

    // Left half: outer margin (left.x) equals the inner border to the cut line.
    const leftOuter = left.x;
    const leftInner = cutX - (left.x + left.w);
    expect(leftOuter).toBe(CANVAS_MARGIN);
    expect(leftInner).toBe(CANVAS_MARGIN);
    expect(leftInner).toBe(leftOuter);

    // Right half: inner border from the cut line equals the outer margin.
    const rightInner = right.x - cutX;
    const rightOuter = CANVAS_WIDTH - (right.x + right.w);
    expect(rightInner).toBe(CANVAS_MARGIN);
    expect(rightOuter).toBe(CANVAS_MARGIN);
    expect(rightInner).toBe(rightOuter);
  });
});

describe('quad grid geometry', () => {
  const layout = resolveQuadLayout();

  it('captures four shots and draws four rects', () => {
    expect(layout.shotCount).toBe(4);
    expect(layout.frames).toHaveLength(4);
  });

  it('sizes the canvas for a 4x6 print at 300 DPI', () => {
    expect(layout.canvas).toEqual({ width: 1200, height: 1800 });
  });

  it('keeps every frame inside the canvas', () => {
    for (const rect of layout.frames) {
      expectInsideCanvas(rect);
    }
  });

  it('arranges the four cells as a 2x2 grid', () => {
    const topLeft = frameAt(layout.frames, 0);
    const topRight = frameAt(layout.frames, 1);
    const bottomLeft = frameAt(layout.frames, 2);
    const bottomRight = frameAt(layout.frames, 3);
    expect(topLeft.y).toBe(topRight.y);
    expect(bottomLeft.y).toBe(bottomRight.y);
    expect(topRight.x).toBeGreaterThan(topLeft.x);
    expect(bottomLeft.y).toBeGreaterThan(topLeft.y);
    expect(bottomRight.x).toBeGreaterThan(bottomLeft.x);
  });
});

describe('resolveLayout dispatch', () => {
  it('routes each id to its resolver', () => {
    expect(resolveLayout('classic').id).toBe('classic');
    expect(resolveLayout('quad').id).toBe('quad');
    expect(resolveLayout('classic').frames).toHaveLength(8);
    expect(resolveLayout('quad').frames).toHaveLength(4);
  });
});

describe('layout preference', () => {
  it("defaults to 'ask' (User's choice)", () => {
    expect(DEFAULT_LAYOUT_PREFERENCE).toBe('ask');
  });

  it("accepts the two concrete layouts and the 'ask' sentinel", () => {
    expect(parseLayoutPreference('classic')).toBe('classic');
    expect(parseLayoutPreference('quad')).toBe('quad');
    expect(parseLayoutPreference('ask')).toBe('ask');
  });

  it("falls back to 'ask' for junk, null, and non-string values", () => {
    expect(parseLayoutPreference('grid')).toBe('ask');
    expect(parseLayoutPreference(null)).toBe('ask');
    expect(parseLayoutPreference(undefined)).toBe('ask');
    expect(parseLayoutPreference(42)).toBe('ask');
  });
});
