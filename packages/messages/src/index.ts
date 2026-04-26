import { STATIC_MESSAGES } from './library';

export { STATIC_MESSAGES };

/**
 * Pick a uniformly-random message from the static library, optionally merged
 * with a host's custom messages (paid-tier feature).
 *
 * @param extras Additional messages added by the event host. Order does not
 *   matter; selection is uniform across the union.
 * @returns A randomly chosen message string.
 */
export function getRandomMessage(extras?: readonly string[]): string {
  const pool = extras && extras.length > 0 ? STATIC_MESSAGES.concat(extras) : STATIC_MESSAGES;
  const index = Math.floor(Math.random() * pool.length);
  // pool always has length >= 9, so this index is always defined.
  const message = pool[index];
  if (message === undefined) {
    // Defensive: should not be reachable.
    throw new Error('getRandomMessage: empty message pool');
  }
  return message;
}
