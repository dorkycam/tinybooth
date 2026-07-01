/**
 * Capture session hook: the photobooth state machine.
 *
 * Owns the per-session loop that the Capture screen renders: a short "Get
 * ready!" intro over the live preview, then for each shot a countdown (with
 * optional ticking sound and haptics), a capture (haptic plus a brief white
 * screen-flash; the OS supplies the shutter sound), and a passive peek of the
 * just-captured shot, looping until every frame is taken. After the last shot it
 * composes the strip via the Skia bridge and hands the result back through
 * `onComplete` so the screen owns navigation.
 *
 * The hook holds no navigation of its own (library-style): the screen passes
 * `onComplete` and `onExit` callbacks and reads back a discriminated
 * {@link CaptureState} plus the camera ref to wire into `CameraSurface`. The loop
 * only runs while `enabled` is true, so the screen can gate it behind the camera
 * permission flow.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { CameraSurfaceHandle } from '@/components/CameraSurface';
import type { PreviewCrop } from '@/lib/cropGeometry';
import { captureHaptic, tickHaptic } from '@/lib/haptics';
import type { StripLayout } from '@/lib/layouts';
import { getRandomMessage } from '@/lib/messages';
import type { CountdownLength } from '@/lib/sessionSettings';
import type { SkiaBridge } from '@/lib/skiaBridge';
import { playCountdownTick, preloadBoothSounds, releaseBoothSounds } from '@/lib/sounds';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Ms to leave the just-captured peek visible before the next countdown. */
const PEEK_HOLD_MS = 1200;
/** Ms to show the "Get ready!" intro before the first countdown begins. */
const GET_READY_MS = 3000;

/**
 * The current step of the capture loop and its associated data.
 *
 * - `get-ready`: holding the friendly intro over the live preview.
 * - `countdown`: counting down to the next shot; `digit` is the number on screen,
 *   or `null` for the brief shutter moment after it reaches zero.
 * - `reveal`: peeking the just-captured shot before the next countdown.
 * - `composing`: building the final strip; the camera is paused.
 */
export type CaptureState =
  | { kind: 'get-ready' }
  | { kind: 'countdown'; digit: number | null }
  | { kind: 'reveal'; uri: string; message: string }
  | { kind: 'composing' };

/** The composed-strip outcome handed to {@link UseCaptureSessionParams.onComplete}. */
export interface CaptureResult {
  /** The layout that was captured. */
  layout: StripLayout;
  /** Captured shot URIs, in capture order. */
  uris: string[];
  /** The composed strip's `file://` URI, or an empty string when compose failed. */
  composedUri: string;
  /** A human-readable compose error, or an empty string on success. */
  composeError: string;
}

/** Inputs for {@link useCaptureSession}. */
export interface UseCaptureSessionParams {
  /** Run the loop only when true (e.g. once the camera permission is ready). */
  enabled: boolean;
  /** The layout being captured; drives the shot count and compose geometry. */
  layout: StripLayout;
  /** How many shots this layout needs. */
  totalFrames: number;
  /** Countdown lead-in length before each shot, in seconds. */
  countdownFrom: CountdownLength;
  /** When true, play the countdown tick sound. */
  soundOn: boolean;
  /** When true, fire a haptic on each tick and on capture. */
  hapticsOn: boolean;
  /** When true, flash the screen white on capture. */
  flashOn: boolean;
  /**
   * The capture screen's crop-box geometry, so composition matches what the
   * guest saw inside the box. Null until the overlay has measured itself.
   */
  crop: PreviewCrop | null;
  /** Called once with the composed result after the final shot. */
  onComplete: (result: CaptureResult) => void;
  /** Called when the guest cancels out of the session. */
  onExit: () => void;
}

/** What {@link useCaptureSession} exposes to the screen. */
export interface UseCaptureSessionResult {
  /** Imperative ref to wire into `CameraSurface`. */
  cameraRef: RefObject<CameraSurfaceHandle | null>;
  /** The current loop step and its data. */
  state: CaptureState;
  /** How many shots have been captured so far. */
  framesCaptured: number;
  /** Whether the white capture flash is currently showing. */
  flashActive: boolean;
  /** Clear the capture flash (wire to `ScreenFlash.onDone`). */
  clearFlash: () => void;
  /** Discard the session and invoke `onExit`. */
  exitToHome: () => void;
}

/**
 * Play the per-tick feedback for one countdown step.
 *
 * @param sound When true, play the countdown tick sound.
 * @param haptics When true, fire a tick haptic.
 */
function fireTick(sound: boolean, haptics: boolean): void {
  if (sound) void playCountdownTick();
  if (haptics) void tickHaptic();
}

/**
 * Drive the photobooth capture loop for a single session.
 *
 * @param params The resolved layout, feedback settings, and screen callbacks.
 * @returns The camera ref, the current {@link CaptureState}, and session controls.
 */
export function useCaptureSession(params: UseCaptureSessionParams): UseCaptureSessionResult {
  const {
    enabled,
    layout,
    totalFrames,
    countdownFrom,
    soundOn,
    hapticsOn,
    flashOn,
    crop,
    onComplete,
    onExit,
  } = params;

  const [state, setState] = useState<CaptureState>({ kind: 'get-ready' });
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const captured = useRef<string[]>([]);
  const cameraRef = useRef<CameraSurfaceHandle | null>(null);

  // Capture a single shot, then advance to the peek (or compose after the last).
  async function fireShutter(): Promise<void> {
    setFlashActive(flashOn);
    // The OS already plays a shutter sound on capture, so we don't play one.
    if (hapticsOn) void captureHaptic();
    let uri = '';
    try {
      uri = await cameraRef.current!.takePhoto();
    } catch {
      uri = `tinybooth://capture/${captured.current.length}`;
    }
    captured.current.push(uri);
    const nextCount = captured.current.length;
    setFramesCaptured(nextCount);
    if (nextCount >= totalFrames) {
      setState({ kind: 'composing' });
    } else {
      setState({ kind: 'reveal', uri, message: getRandomMessage() });
    }
  }

  // Preload sounds once the session is enabled.
  useEffect(() => {
    if (!enabled) return undefined;
    void preloadBoothSounds();
    return () => {
      releaseBoothSounds();
    };
  }, [enabled]);

  // Get ready: hold a friendly intro over the live preview, then start the first
  // countdown. Only runs once enabled so it never races the permission primer.
  useEffect(() => {
    if (!enabled || state.kind !== 'get-ready') return undefined;
    captured.current = [];
    setFramesCaptured(0);
    const timer = setTimeout(() => {
      setState({ kind: 'countdown', digit: null });
    }, GET_READY_MS);
    return () => clearTimeout(timer);
  }, [enabled, state.kind]);

  // Drive the countdown for the current shot.
  useEffect(() => {
    if (!enabled || state.kind !== 'countdown') return undefined;
    let current = countdownFrom;
    setState({ kind: 'countdown', digit: current });
    fireTick(soundOn, hapticsOn);
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setState({ kind: 'countdown', digit: null });
        void fireShutter();
        return;
      }
      setState({ kind: 'countdown', digit: current });
      fireTick(soundOn, hapticsOn);
    }, TICK_MS);
    return () => clearInterval(interval);
    // `fireShutter` is intentionally not a dependency: the countdown re-arms only
    // when the feedback settings change, matching the pre-extraction behavior.
  }, [enabled, state.kind, countdownFrom, soundOn, hapticsOn]);

  // Peek: hold the just-captured shot, then loop into the next countdown.
  useEffect(() => {
    if (state.kind !== 'reveal') return undefined;
    const timer = setTimeout(() => {
      setState({ kind: 'countdown', digit: null });
    }, PEEK_HOLD_MS);
    return () => clearTimeout(timer);
  }, [state.kind]);

  // After the last shot, compose the strip and hand the result to the screen.
  useEffect(() => {
    if (state.kind !== 'composing') return undefined;
    let ignore = false;
    const frames = [...captured.current];
    void (async () => {
      const compose = (globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge })
        .__TINYBOOTH_SKIA_RENDER__;
      let composedUri = '';
      let composeError = '';
      try {
        if (!compose) {
          throw new Error('Strip composer is not available.');
        }
        const result = await compose({
          layout,
          photos: frames.map((uri) => ({ uri, ...(crop ? { crop } : {}) })),
        });
        composedUri = result.uri;
      } catch (error) {
        composeError =
          error instanceof Error ? error.message : 'Could not compose the strip.';
      }
      if (ignore) return;
      onComplete({ layout, uris: frames, composedUri, composeError });
    })();
    return () => {
      ignore = true;
    };
  }, [state.kind, layout, crop, onComplete]);

  const clearFlash = useCallback((): void => {
    setFlashActive(false);
  }, []);

  const exitToHome = useCallback((): void => {
    captured.current = [];
    onExit();
  }, [onExit]);

  return useMemo<UseCaptureSessionResult>(
    () => ({ cameraRef, state, framesCaptured, flashActive, clearFlash, exitToHome }),
    [state, framesCaptured, flashActive, clearFlash, exitToHome],
  );
}
