/**
 * Composes the 1080x1920 IG-format share for a TinyBooth strip.
 *
 * Layout matches `docs/brand/identity.md` section 7: cream-gradient
 * background, photostrip card occupying the upper third, brand wordmark at the
 * bottom safe area. Both Sharp (server) and Skia (mobile) backends share the
 * same geometry helper here.
 */
import sharp from 'sharp';
import { composeStripWithSharp, type ComposeStripOptions } from './sharp.js';

/** IG canvas dimensions. 9:16 vertical. */
export const IG_CANVAS = { w: 1080, h: 1920 } as const;

/** Result of a server-side IG share render. */
export interface IgShareResult {
  buffer: Buffer;
  contentType: 'image/jpeg';
  width: number;
  height: number;
}

/**
 * Geometry for the IG share: where the strip card sits and where the wordmark
 * footer renders. Returned without rendering anything so the Skia bridge can
 * reuse it.
 */
export interface IgShareGeometry {
  canvas: { w: number; h: number };
  card: { x: number; y: number; w: number; h: number };
  wordmark: { x: number; y: number; w: number; h: number; text: string };
}

/**
 * Compute the IG share geometry. Pure math, no rendering.
 *
 * @param stripAspect Aspect ratio (width / height) of the composed strip.
 * @returns Card and wordmark rectangles inside the 1080x1920 canvas.
 */
export function computeIgShareGeometry(stripAspect: number): IgShareGeometry {
  // Reserve the top 250px (avatar/username) and bottom 250px (reply bar) per
  // the brand identity doc.
  const safeTop = 250;
  const safeBottom = 250;
  const usableH = IG_CANVAS.h - safeTop - safeBottom;
  const cardH = Math.floor(usableH * 0.7);
  const cardW = Math.floor(cardH * stripAspect);
  const cardX = Math.floor((IG_CANVAS.w - cardW) / 2);
  const cardY = safeTop + Math.floor((usableH - cardH - 200) / 2);
  return {
    canvas: { w: IG_CANVAS.w, h: IG_CANVAS.h },
    card: { x: cardX, y: cardY, w: cardW, h: cardH },
    wordmark: {
      x: 0,
      y: IG_CANVAS.h - 250,
      w: IG_CANVAS.w,
      h: 200,
      text: 'tinybooth.com',
    },
  };
}

/** Options for the server-side IG share render. */
export interface IgShareOptions extends ComposeStripOptions {
  /** Optional caption rendered on the photo card border. */
  caption?: string;
}

/**
 * Render the IG-format share server-side. The strip is composed first with the
 * usual Sharp pipeline, then placed on the cream gradient background with the
 * brand wordmark at the bottom.
 *
 * @param options Strip options + optional caption.
 * @returns JPEG buffer of the 1080x1920 share image.
 */
export async function composeIgShareWithSharp(options: IgShareOptions): Promise<IgShareResult> {
  const strip = await composeStripWithSharp(options);
  const stripAspect = strip.width / strip.height;
  const geometry = computeIgShareGeometry(stripAspect);

  const background = sharp({
    create: {
      width: IG_CANVAS.w,
      height: IG_CANVAS.h,
      channels: 3,
      background: { r: 244, g: 234, b: 216 },
    },
  });

  const stripResized = await sharp(strip.buffer)
    .resize(geometry.card.w, geometry.card.h, { fit: 'fill' })
    .toBuffer();

  const wordmarkSvg = renderWordmarkSvg(
    geometry.wordmark.w,
    geometry.wordmark.h,
    geometry.wordmark.text,
  );

  const captionSvg = options.caption
    ? renderCaptionSvg(geometry.card.w, 80, options.caption)
    : null;

  const composites: sharp.OverlayOptions[] = [
    { input: stripResized, left: geometry.card.x, top: geometry.card.y },
    { input: Buffer.from(wordmarkSvg), left: geometry.wordmark.x, top: geometry.wordmark.y },
  ];
  if (captionSvg) {
    composites.push({
      input: Buffer.from(captionSvg),
      left: geometry.card.x,
      top: geometry.card.y + geometry.card.h - 80,
    });
  }

  const output = await background.composite(composites).jpeg({ quality: 90 }).toBuffer();
  return {
    buffer: output,
    contentType: 'image/jpeg',
    width: IG_CANVAS.w,
    height: IG_CANVAS.h,
  };
}

function renderWordmarkSvg(width: number, height: number, text: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="50%" y="40%" text-anchor="middle" dominant-baseline="middle"
        font-family="Manrope, system-ui, -apple-system, sans-serif"
        font-weight="700" font-size="72" fill="#1F2937"
        letter-spacing="-1.5">${escapeXml(text)}</text>
  <text x="50%" y="78%" text-anchor="middle" dominant-baseline="middle"
        font-family="Manrope, system-ui, -apple-system, sans-serif"
        font-weight="500" font-size="22" fill="#1F2937" fill-opacity="0.6"
        letter-spacing="3">MAKE YOUR OWN AT TINYBOOTH.COM</text>
</svg>`;
}

function renderCaptionSvg(width: number, height: number, caption: string): string {
  const truncated = caption.length > 28 ? `${caption.slice(0, 27)}...` : caption;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="Caveat, cursive"
        font-weight="500" font-size="56" fill="#1F2937">${escapeXml(truncated)}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
