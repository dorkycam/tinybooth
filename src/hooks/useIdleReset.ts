/**
 * Idle reset hook.
 *
 * Kiosk behavior for non-capture screens: after the configured idle timeout
 * with no taps, the session is discarded and the booth returns to Start. Every
 * tap restarts the timer. Pass `'never'` to disable the timer entirely.
 *
 * The hook owns a one-second ticker so callers can show a countdown, and calls
 * `onTimeout` once the remaining seconds hit zero. Wire the returned `reset` to
 * the screen's `onTouchStart` (or any tap handler) so each interaction extends
 * the session.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { IdleReset } from '@/lib/sessionSettings';

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
  const total = enabled ? idleReset : 0;
  const [secondsLeft, setSecondsLeft] = useState<number>(total);

  // Keep the latest onTimeout without re-arming the interval each render.
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const reset = useCallback((): void => {
    if (enabled) setSecondsLeft(total);
  }, [enabled, total]);

  // Re-seed when the configured timeout changes.
  useEffect(() => {
    setSecondsLeft(total);
  }, [total]);

  // Tick down once per second while enabled.
  useEffect(() => {
    if (!enabled) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [enabled]);

  // Fire once when the countdown elapses.
  useEffect(() => {
    if (enabled && secondsLeft <= 0) onTimeoutRef.current();
  }, [enabled, secondsLeft]);

  return { secondsLeft: enabled ? secondsLeft : null, reset };
}
