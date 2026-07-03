/**
 * Flash-mode decision for a single shot.
 *
 * The booth is front-camera only. Real hardware flash exists just on iPhones
 * (Apple Retina Flash: the front camera reports `hasFlash = true`); iPad and
 * Android front cameras report `hasFlash = false` and vision-camera throws
 * `capture/flash-not-available` if a flash is requested. So the flash setting is
 * satisfied two ways: a real camera flash where the device has one, and an
 * on-screen white fill light everywhere else. This pure helper picks between
 * them so the capture loop and its unit test share one source of truth.
 *
 * Kept dependency-free so it unit tests without the React Native or Expo runtime.
 */

/** The chosen lighting for one shot. */
export interface FlashDecision {
  /** Flash mode passed to the native camera; only `'on'` when a real flash exists. */
  cameraFlash: 'on' | 'off';
  /** Whether to run the JS screen-flash fill light for this shot. */
  useScreenFlash: boolean;
}

/**
 * Decide how to light one shot from the device capability and the flash setting.
 *
 * Passing `cameraFlash: 'on'` is gated on `hasFlash` so `takePhoto` never rejects
 * with `capture/flash-not-available`. When a real flash fires, the screen-flash
 * is suppressed so the two never stack.
 *
 * @param hasFlash Whether the resolved front device has a real flash.
 * @param flashOn Whether the guest turned the flash setting on.
 * @returns The camera flash mode and whether to run the screen-flash fill light.
 */
export function decideFlashMode(hasFlash: boolean, flashOn: boolean): FlashDecision {
  if (!flashOn) return { cameraFlash: 'off', useScreenFlash: false };
  if (hasFlash) return { cameraFlash: 'on', useScreenFlash: false };
  return { cameraFlash: 'off', useScreenFlash: true };
}
