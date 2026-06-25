/**
 * Host-side Skia bridge for `@tinybooth/strip-render`.
 *
 * The shared package leaves the actual pixel pushing to the host so the host
 * can pick the right file system path, image decoder, and base64 codec. We
 * register a function on `globalThis.__TINYBOOTH_SKIA_RENDER__` and the shared
 * `composeStripWithSkia()` calls into it.
 *
 * Implementation:
 *   1. Decode each photo URI via `Skia.Data.fromURI` + `Skia.Image.MakeImageFromEncoded`.
 *   2. Build an offscreen Surface at the layout's canvas size (white background).
 *   3. Draw each frame, cropped to the frame's aspect ratio (centered crop).
 *   4. If `printDuplication === 'horizontal'`, draw the same frame again in
 *      the duplicate column so the printed sheet has two identical strips.
 *   5. Draw the watermark text at the bottom of each visible column.
 *   6. Snapshot the surface, encode to JPEG bytes, write to a temp file via
 *      `expo-file-system`, return the `file://` URI.
 *
 * Both `@shopify/react-native-skia` and `expo-file-system` are lazy-loaded
 * here so unit tests + web bundles continue to work without those native
 * modules.
 */
import type {
  SkiaBridge,
  SkiaBridgePayload,
  SkiaComposeResult,
} from '@tinybooth/strip-render/skia';

interface SkiaImageLike {
  width(): number;
  height(): number;
  dispose?(): void;
}

interface SkiaDataLike {
  dispose?(): void;
}

interface SkiaSurfaceLike {
  getCanvas(): SkiaCanvasLike;
  makeImageSnapshot(): SkiaImageLike & {
    encodeToBase64?(format: number, quality: number): string;
    encodeToBytes?(format: number, quality: number): Uint8Array;
  };
  dispose?(): void;
}

interface SkiaCanvasLike {
  drawColor(color: unknown): void;
  drawImageRect(image: SkiaImageLike, src: SkiaRectLike, dst: SkiaRectLike, paint?: unknown): void;
  drawText(text: string, x: number, y: number, paint: unknown, font: unknown): void;
}

type SkiaRectLike = { x: number; y: number; width: number; height: number };

interface SkiaModule {
  Skia: {
    Data: { fromURI(uri: string): Promise<SkiaDataLike> };
    Image: { MakeImageFromEncoded(data: SkiaDataLike): SkiaImageLike | null };
    Surface: { MakeOffscreen(width: number, height: number): SkiaSurfaceLike | null };
    XYWHRect(x: number, y: number, w: number, h: number): SkiaRectLike;
    Paint(): { setColor(c: unknown): void };
    Color(value: string): unknown;
    Font(typeface?: unknown, size?: number): unknown;
  };
  ImageFormat: { JPEG: number };
}

interface FileSystemModule {
  cacheDirectory: string | null;
  writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: 'base64' | 'utf8' },
  ): Promise<void>;
  EncodingType: { Base64: 'base64' };
}

let cachedSkia: SkiaModule | null = null;
let cachedFs: FileSystemModule | null = null;

async function loadSkia(): Promise<SkiaModule | null> {
  if (cachedSkia) return cachedSkia;
  try {
    const mod = (await import('@shopify/react-native-skia')) as unknown as SkiaModule;
    cachedSkia = mod;
    return mod;
  } catch {
    return null;
  }
}

async function loadFs(): Promise<FileSystemModule | null> {
  if (cachedFs) return cachedFs;
  try {
    // expo-file-system v19 ships its base64 / cacheDirectory / writeAsStringAsync
    // helpers under the `/legacy` entry point. The default entry exports the
    // new File / Directory class API which we don't use here.
    const mod = (await import('expo-file-system/legacy')) as unknown as FileSystemModule;
    cachedFs = mod;
    return mod;
  } catch {
    return null;
  }
}

/** Install the host bridge. Call once from the root layout. */
export function installSkiaBridge(): void {
  const ref = globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge };
  if (ref.__TINYBOOTH_SKIA_RENDER__) return;
  ref.__TINYBOOTH_SKIA_RENDER__ = composeBridge;
}

async function composeBridge(payload: SkiaBridgePayload): Promise<SkiaComposeResult> {
  const skiaMod = await loadSkia();
  const fs = await loadFs();
  if (!skiaMod) {
    throw new Error(
      '[skiaBridge] @shopify/react-native-skia is not loadable. Run a native build (eas build or expo run:ios).',
    );
  }
  if (!fs) {
    throw new Error('[skiaBridge] expo-file-system is not loadable.');
  }
  const { Skia, ImageFormat } = skiaMod;
  const layout = payload.layout;
  const surface = Skia.Surface.MakeOffscreen(layout.canvas.w, layout.canvas.h);
  if (!surface) {
    throw new Error('[skiaBridge] Skia.Surface.MakeOffscreen returned null.');
  }
  const canvas = surface.getCanvas();
  // Skia's drawImageRect requires a Paint argument; reuse one for every frame.
  const paint = Skia.Paint();
  paint.setColor(Skia.Color('#FFFFFF'));
  // White background so the printed sheet has clean separators between photos.
  canvas.drawColor(Skia.Color('#FFFFFF'));

  // Decode every photo once, draw it into one (or two) frame rectangles.
  for (let i = 0; i < layout.frames.length; i += 1) {
    const photo = payload.photos[i];
    const frame = layout.frames[i];
    if (!photo || !frame) continue;
    let img: SkiaImageLike | null = null;
    try {
      const data = await Skia.Data.fromURI(photo.uri);
      img = Skia.Image.MakeImageFromEncoded(data);
      data.dispose?.();
    } catch {
      img = null;
    }
    if (!img) continue;
    const srcRect = centeredCropRect(img.width(), img.height(), frame.w, frame.h);
    const dstRect = Skia.XYWHRect(frame.x, frame.y, frame.w, frame.h);
    canvas.drawImageRect(img, srcRect, dstRect, paint);
    if (layout.printDuplication === 'horizontal' && typeof layout.rightColumnX === 'number') {
      const mirrorDst = Skia.XYWHRect(layout.rightColumnX, frame.y, frame.w, frame.h);
      canvas.drawImageRect(img, srcRect, mirrorDst, paint);
    }
    img.dispose?.();
  }

  // Watermark text rendering is intentionally disabled until we wire a real
  // Skia.Typeface. Skia.Font requires a non-null typeface and there is no
  // cross-platform default we can lean on without shipping a font binary. For
  // now, the strip renders without the bottom wordmark — Print, Share, and
  // Save all use this composition. Tracked in docs/followups.md.

  const snapshot = surface.makeImageSnapshot();
  const base64 = snapshot.encodeToBase64
    ? snapshot.encodeToBase64(ImageFormat.JPEG, 90)
    : encodeFromBytes(snapshot.encodeToBytes?.(ImageFormat.JPEG, 90));
  snapshot.dispose?.();
  surface.dispose?.();

  if (!base64) {
    throw new Error('[skiaBridge] Failed to encode snapshot to JPEG.');
  }

  const dir = fs.cacheDirectory ?? '';
  const outputPath = payload.outputPath ?? `${dir}tinybooth-strip-${Date.now()}.jpg`;
  await fs.writeAsStringAsync(outputPath, base64, { encoding: fs.EncodingType.Base64 });

  return { uri: outputPath, width: layout.canvas.w, height: layout.canvas.h };
}

interface WatermarkRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function drawWatermark(
  Skia: SkiaModule['Skia'],
  canvas: SkiaCanvasLike,
  text: string,
  rect: WatermarkRect,
  layout: SkiaBridgePayload['layout'],
): void {
  const fontSize = Math.max(10, Math.floor(rect.h * 0.6));
  const paint = Skia.Paint();
  paint.setColor(Skia.Color('#1F2937'));
  const font = Skia.Font(undefined, fontSize);
  const baselineY = rect.y + Math.floor(rect.h * 0.8);
  const xLeft = rect.x;
  canvas.drawText(text, xLeft, baselineY, paint, font);
  if (layout.printDuplication === 'horizontal' && typeof layout.rightColumnX === 'number') {
    canvas.drawText(text, layout.rightColumnX, baselineY, paint, font);
  }
}

function centeredCropRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): SkiaRectLike {
  const targetAspect = dstW / dstH;
  const srcAspect = srcW / srcH;
  let cropW: number;
  let cropH: number;
  if (srcAspect > targetAspect) {
    cropH = srcH;
    cropW = Math.floor(srcH * targetAspect);
  } else {
    cropW = srcW;
    cropH = Math.floor(srcW / targetAspect);
  }
  const x = Math.floor((srcW - cropW) / 2);
  const y = Math.floor((srcH - cropH) / 2);
  return { x, y, width: cropW, height: cropH };
}

function encodeFromBytes(bytes: Uint8Array | undefined): string | null {
  if (!bytes) return null;
  // RN's btoa-equivalent: build via standard base64 fast path.
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (typeof g.btoa === 'function') return g.btoa(binary) as string;
  return Buffer.from(bytes).toString('base64');
}
