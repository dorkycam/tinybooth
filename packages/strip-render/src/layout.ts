/**
 * Pure layout math for TinyBooth photostrips. No image library dependencies.
 *
 * Backends (`sharp.ts` for server, `skia.ts` for mobile) consume this module
 * to know where to place photos and the watermark. The math lives here so
 * both backends produce pixel-identical strips.
 *
 * Geometry conventions:
 * - Canvas origin is top-left (0,0).
 * - All units are integer pixels.
 * - Photo frames are listed in capture order (frame 0 is the first photo).
 *
 * Source for the 1x4 classic dimensions: Swift `PhotoUtil.swift:17-18` in
 * `tinybooth-old/`. The 800x1200 canvas with 30px margins shipped to existing
 * iOS users; we preserve it byte-for-byte so the print output stays familiar.
 */

import type { StripLayout } from '@tinybooth/api-types';

/** A rectangle in pixel space. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Watermark placement plus the text to render. */
export interface WatermarkPlacement extends Rect {
  text: string;
}

/** Canvas dimensions for a layout. */
export interface CanvasSize {
  w: number;
  h: number;
}

/** Full layout result consumed by the Sharp / Skia backends. */
export interface LayoutResult {
  layout: StripLayout;
  canvas: CanvasSize;
  /** Photo frames in capture order. */
  frames: Rect[];
  /** Watermark band at the bottom of the strip. */
  watermark: WatermarkPlacement;
}

/** Options for `computeLayout`. */
export interface LayoutOptions {
  /**
   * Watermark text to bake into the placement. Pass an empty string for paid
   * strips where the watermark band is hidden.
   */
  watermarkText?: string;
}

/** Outer margin used by every strip layout. Matches Swift PhotoUtil MARGIN. */
const MARGIN = 30;

/** Watermark band height as a fraction of canvas height. */
const WATERMARK_BAND_RATIO = 0.105;

/** Number of photo frames a layout requires. */
export const FRAME_COUNTS: Record<StripLayout, number> = {
  '1x4_classic': 4,
  '2x2': 4,
  '1x3': 3,
  single: 1,
  '1x6_double': 6,
};

/**
 * Number of frames required by the given layout.
 *
 * @param layout Layout identifier.
 * @returns Integer count of frames the user must capture.
 */
export function frameCountForLayout(layout: StripLayout): number {
  return FRAME_COUNTS[layout];
}

/**
 * Compute the full geometry for a strip layout.
 *
 * @param layout Layout identifier.
 * @param options Optional watermark text override.
 * @returns Canvas + frame + watermark rectangles in pixel space.
 */
export function computeLayout(layout: StripLayout, options: LayoutOptions = {}): LayoutResult {
  const watermarkText = options.watermarkText ?? 'tinybooth.com';
  switch (layout) {
    case '1x4_classic':
      return classic1x4(watermarkText);
    case '2x2':
      return grid2x2(watermarkText);
    case '1x3':
      return column1x3(watermarkText);
    case 'single':
      return single(watermarkText);
    case '1x6_double':
      return double1x6(watermarkText);
    default: {
      // exhaustiveness guard
      const exhaustive: never = layout;
      throw new Error(`Unknown layout: ${String(exhaustive)}`);
    }
  }
}

/**
 * 1x4 classic strip: 800x1200 canvas, two columns of two photos. Mirrors the
 * Swift PhotoUtil layout that ships in the existing iOS app.
 */
function classic1x4(watermarkText: string): LayoutResult {
  const canvas: CanvasSize = { w: 800, h: 1200 };
  const watermark = bottomWatermark(canvas, watermarkText);
  const usableH = watermark.y - MARGIN;
  // Two rows per column inside the usable area, with a margin between them.
  const rowH = Math.floor((usableH - MARGIN) / 2);
  const colW = Math.floor((canvas.w - MARGIN * 3) / 2);
  const frames: Rect[] = [];
  for (let col = 0; col < 2; col += 1) {
    for (let row = 0; row < 2; row += 1) {
      frames.push({
        x: MARGIN + col * (colW + MARGIN),
        y: MARGIN + row * (rowH + MARGIN),
        w: colW,
        h: rowH,
      });
    }
  }
  return { layout: '1x4_classic', canvas, frames, watermark };
}

/** 2x2 grid on a square-ish canvas. */
function grid2x2(watermarkText: string): LayoutResult {
  const canvas: CanvasSize = { w: 1000, h: 1100 };
  const watermark = bottomWatermark(canvas, watermarkText);
  const usableH = watermark.y - MARGIN;
  const rowH = Math.floor((usableH - MARGIN) / 2);
  const colW = Math.floor((canvas.w - MARGIN * 3) / 2);
  const frames: Rect[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 2; col += 1) {
      frames.push({
        x: MARGIN + col * (colW + MARGIN),
        y: MARGIN + row * (rowH + MARGIN),
        w: colW,
        h: rowH,
      });
    }
  }
  return { layout: '2x2', canvas, frames, watermark };
}

/** 1x3 single column of three photos. Slim strip. */
function column1x3(watermarkText: string): LayoutResult {
  const canvas: CanvasSize = { w: 600, h: 1500 };
  const watermark = bottomWatermark(canvas, watermarkText);
  const usableH = watermark.y - MARGIN;
  const rowH = Math.floor((usableH - MARGIN * 2) / 3);
  const colW = canvas.w - MARGIN * 2;
  const frames: Rect[] = [];
  for (let row = 0; row < 3; row += 1) {
    frames.push({
      x: MARGIN,
      y: MARGIN + row * (rowH + MARGIN),
      w: colW,
      h: rowH,
    });
  }
  return { layout: '1x3', canvas, frames, watermark };
}

/** Single 4x6-style postcard with one photo. */
function single(watermarkText: string): LayoutResult {
  const canvas: CanvasSize = { w: 1200, h: 1800 };
  const watermark = bottomWatermark(canvas, watermarkText);
  const usableH = watermark.y - MARGIN;
  const colW = canvas.w - MARGIN * 2;
  const frames: Rect[] = [
    {
      x: MARGIN,
      y: MARGIN,
      w: colW,
      h: usableH - MARGIN,
    },
  ];
  return { layout: 'single', canvas, frames, watermark };
}

/** 1x6 double-column strip (two columns of three). Matches the long Selphy strip. */
function double1x6(watermarkText: string): LayoutResult {
  const canvas: CanvasSize = { w: 800, h: 1800 };
  const watermark = bottomWatermark(canvas, watermarkText);
  const usableH = watermark.y - MARGIN;
  const rowH = Math.floor((usableH - MARGIN * 2) / 3);
  const colW = Math.floor((canvas.w - MARGIN * 3) / 2);
  const frames: Rect[] = [];
  for (let col = 0; col < 2; col += 1) {
    for (let row = 0; row < 3; row += 1) {
      frames.push({
        x: MARGIN + col * (colW + MARGIN),
        y: MARGIN + row * (rowH + MARGIN),
        w: colW,
        h: rowH,
      });
    }
  }
  return { layout: '1x6_double', canvas, frames, watermark };
}

/**
 * Build the bottom watermark band for a canvas. Height is `WATERMARK_BAND_RATIO`
 * of the canvas height, centered horizontally with the standard margin.
 */
function bottomWatermark(canvas: CanvasSize, text: string): WatermarkPlacement {
  const bandH = Math.max(60, Math.floor(canvas.h * WATERMARK_BAND_RATIO));
  return {
    x: MARGIN,
    y: canvas.h - bandH,
    w: canvas.w - MARGIN * 2,
    h: bandH - MARGIN,
    text,
  };
}
