/**
 * Theme preference context.
 *
 * The mobile app supports three theme settings:
 *   - 'system': follow the device's OS color scheme (default).
 *   - 'light': always light.
 *   - 'dark': always dark.
 *
 * The user picks one in Settings. The preference is persisted via
 * `secureStore` so it survives reinstalls of the same app.
 *
 * Components read the resolved theme via `useTheme()` (in `./useTheme.ts`)
 * which folds the preference together with the OS scheme.
 */
import type { JSX, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { readSecure, writeSecure } from '@/lib/secureStore';

/** User-facing theme preference. */
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  /** The current preference. Defaults to 'dark' (the brand default) until persistence loads. */
  preference: ThemePreference;
  /** Update + persist the preference. */
  setPreference(value: ThemePreference): Promise<void>;
}

const DEFAULT_PREFERENCE: ThemePreference = 'dark';
const STORAGE_KEY = 'tinybooth.themePreference.v1';

const ThemeContext = createContext<ThemeContextValue>({
  preference: DEFAULT_PREFERENCE,
  setPreference: async () => undefined,
});

interface ThemePreferenceProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app and exposes the persisted theme preference. Mount once at the
 * root layout above any consumer of `useTheme()`.
 */
export function ThemePreferenceProvider({ children }: ThemePreferenceProviderProps): JSX.Element {
  const [preference, setPreferenceState] = useState<ThemePreference>(DEFAULT_PREFERENCE);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = await readSecure(STORAGE_KEY);
        if (!cancelled && isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      } catch {
        // Ignore; fall back to default.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback(async (value: ThemePreference): Promise<void> => {
    setPreferenceState(value);
    try {
      await writeSecure(STORAGE_KEY, value);
    } catch {
      // Persistence is best-effort.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>{children}</ThemeContext.Provider>
  );
}

/**
 * Read the current theme preference. Use `useTheme()` for resolved colors;
 * this hook is for the Settings screen's picker.
 */
export function useThemePreference(): ThemeContextValue {
  return useContext(ThemeContext);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}
