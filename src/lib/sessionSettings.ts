/**
 * Session settings persisted via AsyncStorage. Keeps the QA toggles, the
 * default layout pick, and the flash preference between launches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_STRIP_LAYOUT, parseStripLayout, type StripLayout } from './layouts';

/** Keys we read/write. */
const KEYS = {
  layout: '@tinybooth/settings/layout',
  flash: '@tinybooth/settings/flash',
  previewClass: '@tinybooth/settings/previewClass',
  saveFrames: '@tinybooth/settings/saveFrames',
} as const;

/** Possible QA preview class overrides. */
export type PreviewClassOverride = 'auto' | 'phone' | 'tablet';

/** Shape of all settings combined. */
export interface SessionSettings {
  layout: StripLayout;
  flash: boolean;
  previewClass: PreviewClassOverride;
  /** When true, every captured frame is also saved to the camera roll alongside the composed strip. */
  saveFrames: boolean;
}

/** Default values. */
export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  layout: DEFAULT_STRIP_LAYOUT,
  flash: false,
  previewClass: 'auto',
  saveFrames: false,
};

/** Read everything in one round trip. */
export async function loadSessionSettings(): Promise<SessionSettings> {
  const [layout, flash, previewClass, saveFrames] = await AsyncStorage.multiGet([
    KEYS.layout,
    KEYS.flash,
    KEYS.previewClass,
    KEYS.saveFrames,
  ]);
  return {
    layout: parseStripLayout(layout?.[1]) ?? DEFAULT_SESSION_SETTINGS.layout,
    flash: flash?.[1] === 'true',
    previewClass:
      parsePreviewClass(previewClass?.[1]) ?? DEFAULT_SESSION_SETTINGS.previewClass,
    saveFrames: saveFrames?.[1] === 'true',
  };
}

/** Persist a partial update. */
export async function saveSessionSettings(patch: Partial<SessionSettings>): Promise<void> {
  const writes: Array<[string, string]> = [];
  if (patch.layout !== undefined) writes.push([KEYS.layout, patch.layout]);
  if (patch.flash !== undefined) writes.push([KEYS.flash, String(patch.flash)]);
  if (patch.previewClass !== undefined) writes.push([KEYS.previewClass, patch.previewClass]);
  if (patch.saveFrames !== undefined) writes.push([KEYS.saveFrames, String(patch.saveFrames)]);
  if (writes.length > 0) {
    await AsyncStorage.multiSet(writes);
  }
}

function parsePreviewClass(value: string | null | undefined): PreviewClassOverride | null {
  switch (value) {
    case 'auto':
    case 'phone':
    case 'tablet':
      return value;
    default:
      return null;
  }
}
