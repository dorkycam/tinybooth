/**
 * Idle reset hook.
 *
 * Kiosk behavior for non-capture screens: after the configured idle timeout
 * with no taps, the session is discarded and the booth returns to Start. Every
 * tap restarts the timer. Pass `'never'` to disable the timer entirely.
 *
 * The countdown is driven off a single monotonic deadline timestamp rather than
 * a per-tick decrement. Each render computes the seconds remaining from the
 * deadline, so settings hydration, re-renders, and rapid resets cannot make the
 * timer drift or fire early. `reset` simply pushes the deadline forward by the
 * full timeout; the screen wires it to `onTouchStart` so every interaction
 * extends the session. `onTimeout` fires exactly once when the deadline passes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IdleReset } from '@/lib/sessionSettings';

/** How often the deadline is sampled, in milliseconds. */
const TICK_MS = 250;

/** Result of {@link useIdleReset}. */
export interface UseIdleResetResult {
  /**
   * Seconds left before timeout, or `null` when the timer is disabled
   * (`idleReset` is `'never'`). Useful for a visible countdown bar.
   */
  secondsLeft: number | null;
  /** Restart the countdown. Call on every user interaction. */
  reset: () => void;
}

/**
 * Run an idle countdown that fires `onTimeout` when it reaches zero.
 *
 * @param idleReset Timeout in seconds, or `'never'` to disable.
 * @param onTimeout Called once when the countdown elapses.
 * @returns The seconds remaining (or `null` when disabled) and a `reset` fn.
 */
export function useIdleReset(idleReset: IdleReset, onTimeout: () => void): UseIdleResetResult {
  const enabled = idleReset !== 'never';
  const totalMs = enabled ? idleReset * 1000 : 0;

  // The wall-clock time at which the session should reset. Lives in a ref so a
  // tap can push it forward without re-arming the ticker.
  const deadlineRef = useRef<number>(Date.now() + totalMs);
  // Guards onTimeout against firing more than once per countdown.
  const firedRef = useRef<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(enabled ? idleReset : 0);

  // Keep the latest onTimeout without re-arming the interval each render.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const reset = useCallback((): void => {
    if (!enabled) return;
    deadlineRef.current = Date.now() + totalMs;
    firedRef.current = false;
    setSecondsLeft(Math.ceil(totalMs / 1000));
  }, [enabled, totalMs]);

  // Re-seed the deadline whenever the configured timeout changes (e.g. after
  // settings hydrate from storage), so the countdown always starts full.
  useEffect(() => {
    deadlineRef.current = Date.now() + totalMs;
    firedRef.current = false;
    setSecondsLeft(enabled ? Math.ceil(totalMs / 1000) : 0);
  }, [enabled, totalMs]);

  // Sample the deadline a few times a second while enabled.
  useEffect(() => {
    if (!enabled) return undefined;
    const interval = setInterval(() => {
      const remainingMs = Math.max(0, deadlineRef.current - Date.now());
      setSecondsLeft(Math.ceil(remainingMs / 1000));
      if (remainingMs <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  return useMemo<UseIdleResetResult>(
    () => ({ secondsLeft: enabled ? secondsLeft : null, reset }),
    [enabled, secondsLeft, reset],
  );
}
