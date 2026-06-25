/**
 * Storage helper for the "what's new" first-launch modal.
 *
 * The modal shows once per app version. When the user dismisses it we write
 * the current version into AsyncStorage so the next launch on the same
 * version skips the modal. A new App Store update bumps the version and the
 * modal reappears once.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@tinybooth/whats-new/seen-version';

/** Read the version the user last saw the modal for. */
export async function readSeenVersion(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

/** Mark the modal as seen for the given version. */
export async function markSeenVersion(version: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, version);
}

/** Returns true when the modal should render for `currentVersion`. */
export async function shouldShowWhatsNew(currentVersion: string): Promise<boolean> {
  const seen = await readSeenVersion();
  return seen !== currentVersion;
}

/** For tests only - clears the persisted state. */
export async function resetWhatsNew(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
