/**
 * Skia strip-composition bridge.
 *
 * Composes the captured frames into a single strip JPEG at print resolution.
 * The compose function is registered on `globalThis.__TINYBOOTH_SKIA_RENDER__`
 * (from the root layout) so the capture flow can call it without a static import
 * of the native Skia module (which is absent in unit tests and web bundles).
 *
 * Geometry comes from `src/lib/layouts.ts`. The resolved layout's `frames` array
 * already includes the duplicated right-column rects for the Classic strip, so
 * this bridge has no layout-specific branching: it draws each shot into each
 * frame rect in order, cropping the shot to the rect's aspect ratio.
 *
 * Implementation:
 *   1. Resolve the layout geometry from `layouts.ts`.
 *   2. Decode each photo URI via `Skia.Data.fromURI` + `MakeImageFromEncoded`.
 *   3. Build an offscreen surface at the canvas size with a white background.
 *   4. Draw each shot center-cropped into its frame rect (Classic duplicates the
 *      shot into both columns because the rect list contains both).
 *   5. Snapshot the surface, encode to JPEG, write to a temp file via
 *      `expo-file-system`, return the `file://` URI.
 *
 * Both `@shopify/react-native-skia` and `expo-file-system` are lazy-loaded with
 * static import strings (per the Metro lazy-import rule) so unit tests and web
 * bundles continue to load without those native modules.
 */
import { resolveLayout, type ResolvedLayout, type StripLayout } from './layouts';

/**
 * Print canvas color for the composed strip. This is the physical paper color
 * behind the photos (a clean white separator between frames), not a UI theme
 * choice, so it is a fixed output constant rather than a theme token.
 */
const STRIP_BACKGROUND = '#FFFFFF';

/** Input to the compose bridge: the layout id plus the captured photos. */
export interface SkiaBridgePayload {
  /** Which layout to compose. The bridge resolves geometry internally. */
  layout: StripLayout;
  /** Captured shot URIs, in capture order. */
  photos: Array<{ uri: string }>;
  /** Optional explicit output path; defaults to the cache directory. */
  outputPath?: string;
}

/** What the bridge returns: a file URI for the composed JPEG and its size. */
export interface SkiaComposeResult {
  uri: string;
  width: number;
  height: number;
}

/** The compose function shape installed on `globalThis`. */
export type SkiaBridge = (payload: SkiaBridgePayload) => Promise<SkiaComposeResult>;

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

/**
 * Install the host compose bridge on `globalThis`. Call once from the root
 * layout. Subsequent calls are no-ops.
 */
export function installSkiaBridge(): void {
  const ref = globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge };
  if (ref.__TINYBOOTH_SKIA_RENDER__) return;
  ref.__TINYBOOTH_SKIA_RENDER__ = composeBridge;
}

/**
 * Compose the captured shots into a single strip JPEG at print resolution.
 *
 * @param payload The layout id, captured photo URIs, and optional output path.
 * @returns The composed strip's `file://` URI and pixel dimensions.
 */
async function composeBridge(payload: SkiaBridgePayload): Promise<SkiaComposeResult> {
  const skiaMod = await loadSkia();
  const fs = await loadFs();
  if (!skiaMod) {
    throw new Error(
      '[skiaBridge] @shopify/react-native-skia is not loadable. Run a native build (expo run:ios / run:android).',
    );
  }
  if (!fs) {
    throw new Error('[skiaBridge] expo-file-system is not loadable.');
  }
  const { Skia, ImageFormat } = skiaMod;
  const layout: ResolvedLayout = resolveLayout(payload.layout);
  const surface = Skia.Surface.MakeOffscreen(layout.canvas.width, layout.canvas.height);
  if (!surface) {
    throw new Error('[skiaBridge] Skia.Surface.MakeOffscreen returned null.');
  }
  const canvas = surface.getCanvas();
  // Skia's drawImageRect requires a Paint argument; reuse one for every frame.
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(STRIP_BACKGROUND));
  // White background so the printed sheet has clean separators between photos.
  canvas.drawColor(Skia.Color(STRIP_BACKGROUND));

  // Decode each distinct shot once and cache it, then draw it into every frame
  // rect that maps to it. The Classic layout repeats shots across two columns,
  // so frame index `i` maps to shot index `i % photos.length`.
  const photoCount = payload.photos.length;
  const decoded = new Map<number, SkiaImageLike>();
  for (let i = 0; i < layout.frames.length; i += 1) {
    const frame = layout.frames[i];
    if (!frame || photoCount === 0) continue;
    const shotIndex = i % photoCount;
    let img = decoded.get(shotIndex) ?? null;
    if (!img) {
      const photo = payload.photos[shotIndex];
      if (!photo) continue;
      try {
        const data = await Skia.Data.fromURI(photo.uri);
        img = Skia.Image.MakeImageFromEncoded(data);
        data.dispose?.();
      } catch {
        img = null;
      }
      if (!img) continue;
      decoded.set(shotIndex, img);
    }
    const srcRect = centeredCropRect(img.width(), img.height(), frame.w, frame.h);
    const dstRect = Skia.XYWHRect(frame.x, frame.y, frame.w, frame.h);
    canvas.drawImageRect(img, srcRect, dstRect, paint);
  }
  for (const img of decoded.values()) {
    img.dispose?.();
  }

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

  return { uri: outputPath, width: layout.canvas.width, height: layout.canvas.height };
}

/**
 * Compute the source rectangle that center-crops a shot to the destination
 * frame's aspect ratio, so the shot fills the frame without distortion.
 *
 * @param srcW Source image width in pixels.
 * @param srcH Source image height in pixels.
 * @param dstW Destination frame width in pixels.
 * @param dstH Destination frame height in pixels.
 * @returns The crop rectangle in source-image pixels.
 */
export function centeredCropRect(
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

/**
 * Base64-encode JPEG bytes when the Skia build lacks `encodeToBase64`.
 *
 * @param bytes The encoded JPEG bytes, or undefined when encoding failed.
 * @returns The base64 string, or null when there are no bytes.
 */
function encodeFromBytes(bytes: Uint8Array | undefined): string | null {
  if (!bytes) return null;
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  const g = globalThis as { btoa?: (input: string) => string };
  if (typeof g.btoa === 'function') return g.btoa(binary);
  return Buffer.from(bytes).toString('base64');
}
