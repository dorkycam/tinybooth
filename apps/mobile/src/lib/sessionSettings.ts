/**
 * Session settings persisted via AsyncStorage. Keeps the QA toggles, the
 * default layout pick, and the flash preference between launches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StripLayout } from '@tinybooth/api-types';

/** Keys we read/write. */
const KEYS = {
  layout: '@tinybooth/settings/layout',
  flash: '@tinybooth/settings/flash',
  previewClass: '@tinybooth/settings/previewClass',
} as const;

/** Possible QA preview class overrides. */
export type PreviewClassOverride = 'auto' | 'phone' | 'tablet';

/** Shape of all settings combined. */
export interface SessionSettings {
  layout: StripLayout;
  flash: boolean;
  previewClass: PreviewClassOverride;
}

/** Default values. */
export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  layout: '1x4_classic',
  flash: false,
  previewClass: 'auto',
};

/** Read everything in one round trip. */
export async function loadSessionSettings(): Promise<SessionSettings> {
  const [layout, flash, previewClass] = await AsyncStorage.multiGet([
    KEYS.layout,
    KEYS.flash,
    KEYS.previewClass,
  ]);
  return {
    layout: parseLayout(layout?.[1]) ?? DEFAULT_SESSION_SETTINGS.layout,
    flash: flash?.[1] === 'true',
    previewClass:
      parsePreviewClass(previewClass?.[1]) ?? DEFAULT_SESSION_SETTINGS.previewClass,
  };
}

/** Persist a partial update. */
export async function saveSessionSettings(patch: Partial<SessionSettings>): Promise<void> {
  const writes: Array<[string, string]> = [];
  if (patch.layout !== undefined) writes.push([KEYS.layout, patch.layout]);
  if (patch.flash !== undefined) writes.push([KEYS.flash, String(patch.flash)]);
  if (patch.previewClass !== undefined) writes.push([KEYS.previewClass, patch.previewClass]);
  if (writes.length > 0) {
    await AsyncStorage.multiSet(writes);
  }
}

function parseLayout(value: string | null | undefined): StripLayout | null {
  switch (value) {
    case '1x4_classic':
    case '2x2':
    case '1x3':
    case 'single':
    case '1x6_double':
      return value;
    default:
      return null;
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
