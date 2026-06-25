/**
 * Settings hook.
 *
 * A small in-memory store layered over the persisted `sessionSettings` module so
 * any screen reads the same live settings without each one re-loading from disk
 * and drifting out of sync. The first hook to mount hydrates from storage; every
 * `update` writes through to storage and notifies all subscribers.
 *
 * The settings are global and rarely change, so a module-level store with a
 * subscriber set is enough. No Redux or Zustand needed.
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  saveSessionSettings,
  type SessionSettings,
} from '@/lib/sessionSettings';

type Listener = () => void;

let current: SessionSettings = DEFAULT_SESSION_SETTINGS;
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SessionSettings {
  return current;
}

/** Load persisted settings into the store once. Safe to call repeatedly. */
async function hydrate(): Promise<void> {
  if (hydrated) return;
  if (!hydrating) {
    hydrating = loadSessionSettings().then((loaded) => {
      current = loaded;
      hydrated = true;
      emit();
    });
  }
  await hydrating;
}

/** Result of {@link useSettings}: the current settings plus an updater. */
export interface UseSettingsResult {
  /** The live settings. Starts at defaults until the first hydrate resolves. */
  settings: SessionSettings;
  /** True once settings have been read from storage at least once. */
  ready: boolean;
  /** Apply a partial update, persist it, and notify every subscriber. */
  update: (patch: Partial<SessionSettings>) => void;
}

/**
 * Subscribe to the shared settings store.
 *
 * @returns The current settings, a ready flag, and an `update` callback.
 */
export function useSettings(): UseSettingsResult {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void hydrate();
  }, []);

  const update = useCallback((patch: Partial<SessionSettings>): void => {
    current = { ...current, ...patch };
    emit();
    void saveSessionSettings(patch);
  }, []);

  return { settings, ready: hydrated, update };
}

/** Test-only: reset the in-memory store to defaults. */
export function __resetSettingsStoreForTests(): void {
  current = DEFAULT_SESSION_SETTINGS;
  hydrated = false;
  hydrating = null;
  listeners.clear();
}
