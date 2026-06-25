/**
 * Sound effects for the booth: countdown ticks + shutter snap.
 *
 * Sources are the original Swift app's mp3s, copied verbatim into
 * `assets/sounds/`. We preload them once on first use so the camera screen
 * can fire them with no perceptible delay between countdown ticks.
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
let shutterPlayer: SoundPlayer | null = null;

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
 * Preload both sound players. Safe to call multiple times; only loads once.
 * Call once when the camera screen mounts so the first tick has no warm-up
 * latency.
 */
export async function preloadBoothSounds(): Promise<void> {
  const mod = await loadAudio();
  if (!mod) return;
  if (!countdownPlayer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
      const src = require('../../assets/sounds/countdown.mp3') as number;
      countdownPlayer = mod.createAudioPlayer(src);
    } catch {
      countdownPlayer = null;
    }
  }
  if (!shutterPlayer) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
      const src = require('../../assets/sounds/shutter.mp3') as number;
      shutterPlayer = mod.createAudioPlayer(src);
    } catch {
      shutterPlayer = null;
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

/** Play the shutter snap. */
export async function playShutter(): Promise<void> {
  const player = shutterPlayer;
  if (!player) return;
  try {
    await player.seekTo(0);
    player.play();
  } catch {
    // Best-effort.
  }
}

/** Free the underlying native players. Optional cleanup on screen unmount. */
export function releaseBoothSounds(): void {
  countdownPlayer?.release();
  shutterPlayer?.release();
  countdownPlayer = null;
  shutterPlayer = null;
}
