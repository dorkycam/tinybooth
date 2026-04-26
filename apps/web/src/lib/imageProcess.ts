/**
 * Image processing pipeline shared by `/api/upload` and the migration script.
 * Mirrors the original TinyWall behavior: auto-rotate by EXIF, resize to a
 * max width, convert to WebP at quality 80.
 */
import sharp from 'sharp';

const MAX_WIDTH = 2048;
const QUALITY = 80;

export interface ProcessedImage {
  buffer: Buffer;
  contentType: 'image/webp';
  width: number;
  height: number;
}

/**
 * Process a single image buffer. Returns the new WebP buffer plus dimensions.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const pipeline = sharp(input)
    .rotate()
    .resize(MAX_WIDTH, undefined, { withoutEnlargement: true })
    .webp({ quality: QUALITY });
  const buffer = await pipeline.toBuffer();
  const meta = await sharp(buffer).metadata();
  return {
    buffer,
    contentType: 'image/webp',
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}
