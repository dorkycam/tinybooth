/**
 * Sound effects for the booth: countdown ticks.
 *
 * The source is the original Swift app's mp3, copied verbatim into
 * `assets/sounds/`. We preload it once on first use so the camera screen
 * can fire ticks with no perceptible delay between them.
 *
 * The capture shutter sound is intentionally not played here. iOS and Android
 * already emit their own shutter sound when a photo is taken, so a second one
 * would double up.
 *
 * `expo-audio` is lazy-loaded so unit tests + web bundles continue to work
 * without the native module.
 */

interface AudioModule {
  AudioModule: {
    setAudioModeAsync(mode: { playsInSilentMode?: boolean }): Promise<void>;
  };
  createAudioPlayer(source: number): {
    play(): void;
    seekTo(seconds: number): Promise<void>;
    release(): void;
    volume: number;
  };
}

interface SoundPlayer {
  play(): void;
  seekTo(seconds: number): Promise<void>;
  release(): void;
  volume: number;
}

let cachedMod: AudioModule | null = null;
let countdownPlayer: SoundPlayer | null = null;

async function loadAudio(): Promise<AudioModule | null> {
  if (cachedMod) return cachedMod;
  try {
    const mod = (await import('expo-audio')) as unknown as AudioModule;
    cachedMod = mod;
    try {
      await mod.AudioModule.setAudioModeAsync({ playsInSilentMode: true });
    } catch {
      // Best-effort.
    }
    return mod;
  } catch {
    return null;
  }
}

/**
 * Preload the countdown tick player. Safe to call multiple times; only loads
 * once. Call once when the camera screen mounts so the first tick has no
 * warm-up latency.
 */
export async function preloadBoothSounds(): Promise<void> {
  const mod = await loadAudio();
  if (!mod) return;
  if (!countdownPlayer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const src = require('../../assets/sounds/countdown.mp3') as number;
      countdownPlayer = mod.createAudioPlayer(src);
    } catch {
      countdownPlayer = null;
    }
  }
}

/** Play a single countdown tick. Restarts from zero if it's already playing. */
export async function playCountdownTick(): Promise<void> {
  const player = countdownPlayer;
  if (!player) return;
  try {
    await player.seekTo(0);
    player.play();
  } catch {
    // Best-effort.
  }
}

/** Free the underlying native player. Optional cleanup on screen unmount. */
export function releaseBoothSounds(): void {
  countdownPlayer?.release();
  countdownPlayer = null;
}
