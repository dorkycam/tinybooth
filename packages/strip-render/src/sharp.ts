/**
 * Server-side strip composition using `sharp`.
 *
 * Used by the web app to render the IG-share image and (in Phase 4+) any
 * server-rendered fallback for mobile clients. The output is a Buffer the
 * caller is responsible for storing or streaming.
 *
 * The geometry comes from `layout.ts`; this module is purely the pixel pusher.
 */
import sharp from 'sharp';
import { computeLayout, type LayoutResult, type Rect } from './layout.js';
import { watermarkForLayout, type EntitlementState, type BrandingOverride } from './watermark.js';
import type { StripLayout } from '@tinybooth/api-types';

/** A photo to place in the strip. Buffer is the source bytes (any format Sharp reads). */
export interface PhotoInput {
  /** Raw image bytes. */
  buffer: Buffer;
}

/** Options for `composeStripWithSharp`. */
export interface ComposeStripOptions {
  layout: StripLayout;
  photos: PhotoInput[];
  entitlements?: EntitlementState;
  branding?: BrandingOverride;
  /**
   * Background color for the canvas. Defaults to the brand `cream` swatch
   * (`#F4EAD8`). Provide a hex string without the leading `#`.
   */
  backgroundHex?: string;
}

/** Result returned by Sharp composition. */
export interface ComposeStripResult {
  buffer: Buffer;
  contentType: 'image/jpeg';
  width: number;
  height: number;
  layout: LayoutResult;
}

const DEFAULT_BG_HEX = 'F4EAD8';
const DEFAULT_INK_HEX = '1F2937';

/**
 * Compose a photostrip using Sharp on the server.
 *
 * Throws if the photo count does not match the layout's required frame count.
 *
 * @param options Layout, photo buffers, and entitlement/branding flags.
 * @returns JPEG buffer plus the dimensions and computed layout.
 */
export async function composeStripWithSharp(
  options: ComposeStripOptions,
): Promise<ComposeStripResult> {
  const layout = computeLayout(options.layout);
  if (options.photos.length !== layout.frames.length) {
    throw new Error(
      `composeStripWithSharp: expected ${layout.frames.length} photos for layout ${options.layout}, got ${options.photos.length}`,
    );
  }
  const watermark = watermarkForLayout(
    options.layout,
    options.entitlements ?? { stripUnlock: false },
    options.branding,
  );
  const backgroundHex = options.backgroundHex ?? DEFAULT_BG_HEX;
  const bg = parseHex(backgroundHex);

  const canvas = sharp({
    create: {
      width: layout.canvas.w,
      height: layout.canvas.h,
      channels: 3,
      background: { r: bg.r, g: bg.g, b: bg.b },
    },
  });

  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < layout.frames.length; i += 1) {
    const frame = layout.frames[i];
    const photo = options.photos[i];
    if (!frame || !photo) {
      // exhausted by the length check above; defensive only.
      continue;
    }
    const fitted = await fitPhotoToFrame(photo.buffer, frame);
    composites.push({ input: fitted, left: frame.x, top: frame.y });
  }

  if (watermark.visible) {
    const svg = renderWatermarkSvg(layout.watermark.w, layout.watermark.h, watermark.text);
    composites.push({
      input: Buffer.from(svg),
      left: layout.watermark.x,
      top: layout.watermark.y,
    });
  }

  const composed = await canvas.composite(composites).jpeg({ quality: 90 }).toBuffer();
  return {
    buffer: composed,
    contentType: 'image/jpeg',
    width: layout.canvas.w,
    height: layout.canvas.h,
    layout,
  };
}

/** Resize + crop one photo to exactly fill a frame. */
async function fitPhotoToFrame(buffer: Buffer, frame: Rect): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(frame.w, frame.h, { fit: 'cover', position: 'attention' })
    .toBuffer();
}

/** Render the watermark as an SVG band so Sharp can composite it without a font file. */
function renderWatermarkSvg(width: number, height: number, text: string): string {
  const fontSize = Math.max(18, Math.floor(height * 0.55));
  const escaped = escapeXml(text);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="Manrope, system-ui, -apple-system, sans-serif"
        font-weight="700" font-size="${fontSize}" fill="#${DEFAULT_INK_HEX}"
        letter-spacing="2">${escaped}</text>
</svg>`;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function parseHex(hex: string): RGB {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`parseHex: expected 6-digit hex, got ${hex}`);
  }
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
