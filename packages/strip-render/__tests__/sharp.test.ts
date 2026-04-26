import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { composeStripWithSharp, type PhotoInput } from '../src/sharp';
import { computeIgShareGeometry, composeIgShareWithSharp } from '../src/igShare';

/**
 * Build a 50x50 RGB fixture buffer in-memory. Each call returns a fresh JPEG
 * with a slight color shift so we can identify frames in the composed strip
 * if we need to debug visually.
 */
async function fixture(seed: number): Promise<Buffer> {
  const r = (seed * 31) % 255;
  const g = (seed * 53) % 255;
  const b = (seed * 79) % 255;
  return sharp({
    create: { width: 50, height: 50, channels: 3, background: { r, g, b } },
  })
    .jpeg()
    .toBuffer();
}

async function fixtures(count: number): Promise<PhotoInput[]> {
  const out: PhotoInput[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({ buffer: await fixture(i + 1) });
  }
  return out;
}

describe('composeStripWithSharp', () => {
  it('produces a JPEG of the expected canvas size for 1x4 classic', async () => {
    const result = await composeStripWithSharp({
      layout: '1x4_classic',
      photos: await fixtures(4),
    });
    expect(result.contentType).toBe('image/jpeg');
    expect(result.width).toBe(800);
    expect(result.height).toBe(1200);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(1200);
    expect(meta.format).toBe('jpeg');
  });

  it('produces output for every supported layout', async () => {
    const cases = [
      { layout: '1x4_classic', n: 4 },
      { layout: '2x2', n: 4 },
      { layout: '1x3', n: 3 },
      { layout: 'single', n: 1 },
      { layout: '1x6_double', n: 6 },
    ] as const;
    for (const { layout, n } of cases) {
      const result = await composeStripWithSharp({
        layout,
        photos: await fixtures(n),
      });
      const meta = await sharp(result.buffer).metadata();
      expect(meta.width).toBe(result.width);
      expect(meta.height).toBe(result.height);
    }
  });

  it('throws when the photo count does not match the layout', async () => {
    await expect(
      composeStripWithSharp({
        layout: '1x4_classic',
        photos: await fixtures(3),
      }),
    ).rejects.toThrow(/expected 4 photos/);
  });

  it('renders the watermark band by default but skips it for entitled users', async () => {
    const free = await composeStripWithSharp({
      layout: 'single',
      photos: await fixtures(1),
    });
    const paid = await composeStripWithSharp({
      layout: 'single',
      photos: await fixtures(1),
      entitlements: { stripUnlock: true },
    });
    // Both renders are valid JPEGs of the same canvas. We do not assert pixel
    // diffs here (that's better suited to a visual regression suite); we only
    // verify both code paths complete and produce well-formed images.
    expect(free.width).toBe(paid.width);
    expect(free.height).toBe(paid.height);
  });

  it('accepts a custom background hex', async () => {
    const result = await composeStripWithSharp({
      layout: 'single',
      photos: await fixtures(1),
      backgroundHex: 'FBF7EE',
    });
    expect(result.width).toBe(1200);
  });

  it('rejects a malformed background hex', async () => {
    await expect(
      composeStripWithSharp({
        layout: 'single',
        photos: await fixtures(1),
        backgroundHex: 'not-hex',
      }),
    ).rejects.toThrow(/parseHex/);
  });
});

describe('composeIgShareWithSharp', () => {
  it('produces a 1080x1920 JPEG', async () => {
    const result = await composeIgShareWithSharp({
      layout: '1x4_classic',
      photos: await fixtures(4),
    });
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1920);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
  });

  it('honors an optional caption', async () => {
    const result = await composeIgShareWithSharp({
      layout: '2x2',
      photos: await fixtures(4),
      caption: 'Sam turned 30',
    });
    expect(result.contentType).toBe('image/jpeg');
  });
});

describe('computeIgShareGeometry', () => {
  it('places the card inside the IG safe area', () => {
    const geo = computeIgShareGeometry(800 / 1200);
    expect(geo.canvas).toEqual({ w: 1080, h: 1920 });
    expect(geo.card.x).toBeGreaterThanOrEqual(0);
    expect(geo.card.y).toBeGreaterThanOrEqual(250);
    expect(geo.card.x + geo.card.w).toBeLessThanOrEqual(geo.canvas.w);
    expect(geo.card.y + geo.card.h).toBeLessThanOrEqual(geo.canvas.h - 250);
    expect(geo.wordmark.text).toBe('tinybooth.com');
  });

  it('scales card width with the strip aspect ratio', () => {
    const tall = computeIgShareGeometry(0.5);
    const wide = computeIgShareGeometry(1.5);
    expect(wide.card.w).toBeGreaterThan(tall.card.w);
  });
});
