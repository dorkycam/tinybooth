/**
 * Static random message library shown after each photo.
 *
 * Migrated verbatim from the original PhotoBerry app's `sillyMessages` array.
 * These nine strings have shipped to existing users for years and are part of
 * the brand. Do not reorder, rename, or remove any entry. New messages may be
 * appended only.
 */

/** The original encouraging sayings shown after each captured shot. */
export const STATIC_MESSAGES: readonly string[] = [
  'Smile!',
  'Cheese!',
  'Work it!',
  'Cute!',
  'Perfect!',
  'Pose!',
  'Adorable!',
  "That's Great!",
  '\u{1F60E}',
  // Newer additions, appended after the original nine. Order of the entries
  // above is part of the brand and must never change; only append here.
  'Strike a pose!',
  'Looking good!',
  'Love it!',
  'Big smile!',
  'Gorgeous!',
  'Fabulous!',
  'One more!',
  'Yes!',
] as const;

/**
 * Pick a uniformly random encouraging message from {@link STATIC_MESSAGES}.
 *
 * @returns A single message string drawn at random from the library.
 */
export function getRandomMessage(): string {
  const index = Math.floor(Math.random() * STATIC_MESSAGES.length);
  // `index` is always in range, but the `?? first` keeps this total and typed
  // without an assertion under `noUncheckedIndexedAccess`.
  return STATIC_MESSAGES[index] ?? STATIC_MESSAGES[0] ?? 'Smile!';
}
