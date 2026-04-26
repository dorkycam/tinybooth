/**
 * Profanity filter wrapper around the `bad-words` library used by the original
 * TinyWall. Centralized so server code (tRPC routers, REST routes) shares one
 * import.
 */
import { Filter } from 'bad-words';

const filter = new Filter();

/**
 * Replace any profane words in `text` with asterisks. Returns the trimmed and
 * cleaned string. Empty input returns ''.
 */
export function clean(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length === 0) return '';
  return filter.clean(trimmed);
}

/** True if the string contains any banned word. */
export function isProfane(text: string | null | undefined): boolean {
  if (!text) return false;
  return filter.isProfane(text);
}
