/**
 * Hook returning the active Theme.
 *
 * The active mode is the fold of:
 *   1. `forceMode` if the caller passed one (e.g. the camera screen forces
 *      dark so the propped-up tablet doesn't blast a dim venue).
 *   2. The user's persisted preference from `ThemePreferenceProvider`
 *      ('system' | 'light' | 'dark').
 *   3. The OS color scheme when preference is 'system'.
 *   4. Dark as the brand default when nothing else applies.
 */
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ThemeMode } from './theme';
import { useThemePreference } from './ThemeContext';

/**
 * Returns the theme for the resolved mode.
 *
 * @param forceMode Optional mode to use instead of the user preference + OS scheme.
 */
export function useTheme(forceMode?: ThemeMode): Theme {
  const scheme = useColorScheme();
  const { preference } = useThemePreference();
  if (forceMode) return buildTheme(forceMode);
  if (preference === 'light') return buildTheme('light');
  if (preference === 'dark') return buildTheme('dark');
  return buildTheme(scheme === 'light' ? 'light' : 'dark');
}
