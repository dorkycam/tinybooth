/**
 * On-device strip composition using `@shopify/react-native-skia`.
 *
 * This module is written defensively. `react-native-skia` is a native module
 * that does not load in node, so we lazy-import the runtime only when
 * `composeStripWithSkia` is actually called. The Sharp-equivalent geometry
 * comes from `layout.ts` so the two backends are pixel-aligned.
 *
 * Skia unit tests are skipped because the React Native runtime is not
 * available under vitest. Coverage on the layout math (consumed here) lives in
 * `__tests__/layout.test.ts`; we treat this file as a thin Skia adapter.
 */
import { computeLayout } from './layout.js';
import { watermarkForLayout, type EntitlementState, type BrandingOverride } from './watermark.js';
import type { StripLayout } from '@tinybooth/api-types';

/** Photo source for Skia. Either a `file://` URI or a base64 string. */
export interface SkiaPhotoInput {
  uri: string;
}

/** Options for `composeStripWithSkia`. */
export interface SkiaComposeOptions {
  layout: StripLayout;
  photos: SkiaPhotoInput[];
  entitlements?: EntitlementState;
  branding?: BrandingOverride;
  /**
   * Output file path. The composed JPEG is written here so callers can hand
   * the URI to `expo-print`, `expo-sharing`, or `expo-media-library`. If
   * omitted, a temporary path under the app cache directory is used.
   */
  outputPath?: string;
}

/** Result returned by Skia composition. */
export interface SkiaComposeResult {
  /** `file://` URI to the saved JPEG. */
  uri: string;
  width: number;
  height: number;
}

/**
 * Minimal interface we need from `@shopify/react-native-skia`. We type the
 * surface narrowly so a missing native module fails with a clear message at
 * call time instead of crashing on import.
 */
interface SkiaSurfaceLike {
  makeImageSnapshot(): { encodeToBytes(): Uint8Array };
}

/**
 * Lazy loader for the Skia runtime. Returns null if Skia is unavailable
 * (typical in unit tests / web bundles).
 *
 * We resolve the module via a runtime expression so the TypeScript compiler
 * does not require `@shopify/react-native-skia` to be a typed dependency of
 * this package. The host app (mobile) installs the native package; this
 * shared package merely calls into it when present.
 */
async function loadSkia(): Promise<unknown | null> {
  try {
    const moduleId = ['@shopify', 'react-native-skia'].join('/');
    const dynamicImport = new Function('id', 'return import(id);') as (
      id: string,
    ) => Promise<unknown>;
    return await dynamicImport(moduleId).catch(() => null);
  } catch {
    return null;
  }
}

/**
 * Compose a photostrip on-device with Skia and write the result to disk.
 *
 * Throws when Skia is not available (e.g. running under node) or when the
 * supplied photo count does not match the layout's required frame count.
 *
 * Implementation note: a complete Skia render requires the Skia runtime, an
 * image decoder per source URI, and a writable file system path. Those APIs
 * differ between Expo, bare RN, and web. This function delegates to a thin
 * native helper exposed via `globalThis.__TINYBOOTH_SKIA_RENDER__` so the host
 * app can wire in its own implementation in `apps/mobile/src/lib/skiaBridge.ts`
 * during Phase 2 native build. Until that bridge is wired, this throws.
 *
 * @param options Layout, photos, output path.
 * @returns URI to the rendered JPEG plus its dimensions.
 */
export async function composeStripWithSkia(options: SkiaComposeOptions): Promise<SkiaComposeResult> {
  const layout = computeLayout(options.layout);
  if (options.photos.length !== layout.frames.length) {
    throw new Error(
      `composeStripWithSkia: expected ${layout.frames.length} photos for layout ${options.layout}, got ${options.photos.length}`,
    );
  }
  const watermark = watermarkForLayout(
    options.layout,
    options.entitlements ?? { stripUnlock: false },
    options.branding,
  );
  const skia = await loadSkia();
  if (!skia) {
    throw new Error(
      'composeStripWithSkia: @shopify/react-native-skia not available. ' +
        'Install the package and ensure the native module is linked, or run on a real device.',
    );
  }
  const bridge = readGlobalBridge();
  if (!bridge) {
    throw new Error(
      'composeStripWithSkia: no native bridge registered. ' +
        'Set globalThis.__TINYBOOTH_SKIA_RENDER__ from the host app (see apps/mobile/src/lib/skiaBridge.ts).',
    );
  }
  return bridge({
    layout,
    photos: options.photos,
    watermark,
    outputPath: options.outputPath,
  });
}

/** Bridge contract the host mobile app implements. */
export interface SkiaBridgePayload {
  layout: ReturnType<typeof computeLayout>;
  photos: SkiaPhotoInput[];
  watermark: ReturnType<typeof watermarkForLayout>;
  outputPath?: string;
}

export type SkiaBridge = (payload: SkiaBridgePayload) => Promise<SkiaComposeResult>;

function readGlobalBridge(): SkiaBridge | null {
  const ref = (globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge }).__TINYBOOTH_SKIA_RENDER__;
  return typeof ref === 'function' ? ref : null;
}

// Re-export a couple of types so the host app can implement the bridge with
// the same shape this module expects.
export type { SkiaSurfaceLike };
