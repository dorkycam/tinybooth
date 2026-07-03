/**
 * Session settings persisted via AsyncStorage. Keeps the capture toggles, the
 * default layout pick, and the flash preference between launches.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LAYOUT_PREFERENCE,
  type LayoutPreference,
  parseLayoutPreference,
} from './layouts';

/** Keys we read/write. */
const KEYS = {
  layout: '@tinybooth/settings/layout',
  flash: '@tinybooth/settings/flash',
  saveFrames: '@tinybooth/settings/saveFrames',
  countdown: '@tinybooth/settings/countdown',
  sound: '@tinybooth/settings/sound',
  haptics: '@tinybooth/settings/haptics',
  idleReset: '@tinybooth/settings/idleReset',
} as const;

/** Countdown length choices, in seconds, offered in Settings. */
export const COUNTDOWN_CHOICES = [3, 5, 10] as const;

/** A supported countdown length in seconds. */
export type CountdownLength = (typeof COUNTDOWN_CHOICES)[number];

/**
 * Idle reset choices, in seconds, offered in Settings. `'never'` keeps the
 * booth on the current screen until someone taps a button.
 */
export const IDLE_RESET_CHOICES = [15, 30, 60, 'never'] as const;

/** A supported idle reset value: a number of seconds, or `'never'`. */
export type IdleReset = (typeof IDLE_RESET_CHOICES)[number];

/** Shape of all settings combined. */
export interface SessionSettings {
  /**
   * Default layout preference. A concrete layout skips the picker and opens
   * capture directly; `'ask'` (User's choice) shows the picker each session.
   */
  layout: LayoutPreference;
  flash: boolean;
  /** When true, every captured frame is also saved to the camera roll alongside the composed strip. */
  saveFrames: boolean;
  /** Countdown lead-in length before each shot, in seconds. */
  countdown: CountdownLength;
  /** When true, the countdown ticks and shutter snap play. */
  sound: boolean;
  /** When true, each countdown tick and capture fires a haptic. */
  haptics: boolean;
  /** Idle timeout before a non-capture screen returns to Start. `'never'` disables it. */
  idleReset: IdleReset;
}

/** Default values. */
export const DEFAULT_SESSION_SETTINGS: SessionSettings = {
  layout: DEFAULT_LAYOUT_PREFERENCE,
  flash: false,
  saveFrames: false,
  countdown: 3,
  sound: true,
  haptics: true,
  idleReset: 30,
};

/** Read everything in one round trip. */
export async function loadSessionSettings(): Promise<SessionSettings> {
  const [layout, flash, saveFrames, countdown, sound, haptics, idleReset] =
    await AsyncStorage.multiGet([
      KEYS.layout,
      KEYS.flash,
      KEYS.saveFrames,
      KEYS.countdown,
      KEYS.sound,
      KEYS.haptics,
      KEYS.idleReset,
    ]);
  return {
    layout: parseLayoutPreference(layout?.[1]),
    flash: flash?.[1] === 'true',
    saveFrames: saveFrames?.[1] === 'true',
    countdown: parseCountdown(countdown?.[1]) ?? DEFAULT_SESSION_SETTINGS.countdown,
    // Sound and haptics default on; only an explicit "false" turns them off.
    sound: sound?.[1] === null || sound?.[1] === undefined ? DEFAULT_SESSION_SETTINGS.sound : sound[1] === 'true',
    haptics:
      haptics?.[1] === null || haptics?.[1] === undefined
        ? DEFAULT_SESSION_SETTINGS.haptics
        : haptics[1] === 'true',
    idleReset: parseIdleReset(idleReset?.[1]) ?? DEFAULT_SESSION_SETTINGS.idleReset,
  };
}

/** Persist a partial update. */
export async function saveSessionSettings(patch: Partial<SessionSettings>): Promise<void> {
  const writes: Array<[string, string]> = [];
  if (patch.layout !== undefined) writes.push([KEYS.layout, patch.layout]);
  if (patch.flash !== undefined) writes.push([KEYS.flash, String(patch.flash)]);
  if (patch.saveFrames !== undefined) writes.push([KEYS.saveFrames, String(patch.saveFrames)]);
  if (patch.countdown !== undefined) writes.push([KEYS.countdown, String(patch.countdown)]);
  if (patch.sound !== undefined) writes.push([KEYS.sound, String(patch.sound)]);
  if (patch.haptics !== undefined) writes.push([KEYS.haptics, String(patch.haptics)]);
  if (patch.idleReset !== undefined) writes.push([KEYS.idleReset, String(patch.idleReset)]);
  if (writes.length > 0) {
    await AsyncStorage.multiSet(writes);
  }
}

function parseCountdown(value: string | null | undefined): CountdownLength | null {
  const parsed = Number.parseInt(value ?? '', 10);
  return (COUNTDOWN_CHOICES as readonly number[]).includes(parsed)
    ? (parsed as CountdownLength)
    : null;
}

function parseIdleReset(value: string | null | undefined): IdleReset | null {
  if (value === 'never') return 'never';
  const parsed = Number.parseInt(value ?? '', 10);
  return (IDLE_RESET_CHOICES as readonly (number | string)[]).includes(parsed)
    ? (parsed as IdleReset)
    : null;
}
