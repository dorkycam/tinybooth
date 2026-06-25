/**
 * Haptic feedback for the booth.
 *
 * Thin wrapper over `expo-haptics`. The module is lazy-loaded with a static
 * import string (per the Metro lazy-import rule) so unit tests and web bundles
 * load without the native module. Every call is best-effort: if the module or
 * the device cannot vibrate, the call is a no-op.
 */

interface HapticsModule {
  impactAsync(style: unknown): Promise<void>;
  notificationAsync(type: unknown): Promise<void>;
  ImpactFeedbackStyle: { Light: unknown; Medium: unknown; Heavy: unknown };
  NotificationFeedbackType: { Success: unknown };
}

let cachedMod: HapticsModule | null = null;

async function loadHaptics(): Promise<HapticsModule | null> {
  if (cachedMod) return cachedMod;
  try {
    const mod = (await import('expo-haptics')) as unknown as HapticsModule;
    cachedMod = mod;
    return mod;
  } catch {
    return null;
  }
}

/**
 * Fire a light tap, used for each countdown tick.
 *
 * @returns Resolves once the haptic has been requested. Never rejects.
 */
export async function tickHaptic(): Promise<void> {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    await mod.impactAsync(mod.ImpactFeedbackStyle.Light);
  } catch {
    // Best-effort.
  }
}

/**
 * Fire a heavier impact at the moment a shot is captured.
 *
 * @returns Resolves once the haptic has been requested. Never rejects.
 */
export async function captureHaptic(): Promise<void> {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    await mod.impactAsync(mod.ImpactFeedbackStyle.Heavy);
  } catch {
    // Best-effort.
  }
}
