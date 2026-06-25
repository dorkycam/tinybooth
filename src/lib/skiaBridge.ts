/**
 * Skia strip-composition bridge.
 *
 * Composes the captured frames into a single strip JPEG. The function is
 * registered on `globalThis.__TINYBOOTH_SKIA_RENDER__` so the capture flow can
 * call it without a static import of the native Skia module (which is absent in
 * unit tests). Phase 2 supplies the resolved layout geometry from
 * `src/lib/layouts.ts`.
 *
 * Implementation:
 *   1. Decode each photo URI via `Skia.Data.fromURI` + `Skia.Image.MakeImageFromEncoded`.
 *   2. Build an offscreen Surface at the layout's canvas size (white background).
 *   3. Draw each frame, cropped to the frame's aspect ratio (centered crop).
 *   4. If `printDuplication === 'horizontal'`, draw the same frame again in
 *      the duplicate column so the printed sheet has two identical strips.
 *   5. Snapshot the surface, encode to JPEG bytes, write to a temp file via
 *      `expo-file-system`, return the `file://` URI.
 *
 * Both `@shopify/react-native-skia` and `expo-file-system` are lazy-loaded
 * here so unit tests + web bundles continue to work without those native
 * modules.
 */
/**
 * A single frame rectangle on the strip canvas, in canvas pixels.
 */
interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Resolved layout geometry passed to the bridge. Phase 2 produces this from
 * `src/lib/layouts.ts`; the bridge only needs the canvas size and frame rects.
 */
interface ResolvedLayout {
  canvas: { w: number; h: number };
  frames: FrameRect[];
  /** When 'horizontal', each frame is mirrored into the right column. */
  printDuplication?: 'horizontal' | 'none';
  /** Left edge of the duplicated right column, in canvas pixels. */
  rightColumnX?: number;
}

/** Input to the compose bridge: the resolved layout plus the captured photos. */
interface SkiaBridgePayload {
  layout: ResolvedLayout;
  photos: Array<{ uri: string }>;
  /** Optional explicit output path; defaults to the cache directory. */
  outputPath?: string;
}

/** What the bridge returns: a file URI for the composed JPEG and its size. */
interface SkiaComposeResult {
  uri: string;
  width: number;
  height: number;
}

/** The compose function shape installed on `globalThis`. */
type SkiaBridge = (payload: SkiaBridgePayload) => Promise<SkiaComposeResult>;

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
  const g = globalThis as { btoa?: (input: string) => string };
  if (typeof g.btoa === 'function') return g.btoa(binary);
  return Buffer.from(bytes).toString('base64');
}
