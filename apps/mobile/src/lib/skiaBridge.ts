/**
 * Host-side Skia bridge for `@tinybooth/strip-render`.
 *
 * The shared package leaves the actual pixel pushing to the host so the host
 * can pick the right file system path, image decoder, and (in the future) the
 * right caller for IG-share previews. We register a function on
 * `globalThis.__TINYBOOTH_SKIA_RENDER__` and `composeStripWithSkia()` calls
 * into it.
 *
 * Phase 2 ships a placeholder bridge that throws a helpful error. The real
 * implementation lands once we run `expo prebuild` against a development
 * client (it requires the Skia native module which does not link in vitest /
 * web bundles).
 */
import type { SkiaBridge, SkiaBridgePayload, SkiaComposeResult } from '@tinybooth/strip-render';

/** Install the host bridge. Call once from the root layout. */
export function installSkiaBridge(): void {
  const ref = globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge };
  if (ref.__TINYBOOTH_SKIA_RENDER__) return;
  ref.__TINYBOOTH_SKIA_RENDER__ = placeholderBridge;
}

async function placeholderBridge(payload: SkiaBridgePayload): Promise<SkiaComposeResult> {
  throw new Error(
    `[skiaBridge] Native Skia render not wired yet for layout ${payload.layout.layout}. ` +
      'Run `expo prebuild` and provide a real implementation in apps/mobile/src/lib/skiaBridge.ts.',
  );
}
