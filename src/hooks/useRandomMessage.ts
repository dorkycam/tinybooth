/**
 * Random-message hook used by the camera screen. Wraps `getRandomMessage` from
 * `@tinybooth/messages` and tracks the visible message via React state so the
 * UI can swap text and animate without re-running the hook.
 */
import { useCallback, useState } from 'react';
import { getRandomMessage } from '@tinybooth/messages';

/** Hook return value. */
export interface UseRandomMessage {
  /** Currently displayed message; null before the first reveal. */
  message: string | null;
  /** Pull a new random message and set it as the visible one. */
  reveal: () => string;
  /** Hide the current message. */
  hide: () => void;
}

/**
 * Maintain the active "after photo" message for the camera screen.
 *
 * @param extras Optional host-supplied custom messages merged into the pool.
 */
export function useRandomMessage(extras?: readonly string[]): UseRandomMessage {
  const [message, setMessage] = useState<string | null>(null);

  const reveal = useCallback<() => string>(() => {
    const next = getRandomMessage(extras);
    setMessage(next);
    return next;
  }, [extras]);

  const hide = useCallback<() => void>(() => {
    setMessage(null);
  }, []);

  return { message, reveal, hide };
}
