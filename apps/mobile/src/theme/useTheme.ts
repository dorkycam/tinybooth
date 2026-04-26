/**
 * Hook returning the active Theme for the current device color scheme.
 *
 * Wraps RN's `useColorScheme` and the layout-class hook so screens can write:
 * ```tsx
 * const theme = useTheme();
 * <View style={{ backgroundColor: theme.colors.bg }} />
 * ```
 */
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme } from './theme';

/**
 * Returns the theme for the current OS color scheme. Defaults to light when
 * the OS does not report a preference.
 */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme === 'dark' ? 'dark' : 'light');
}
