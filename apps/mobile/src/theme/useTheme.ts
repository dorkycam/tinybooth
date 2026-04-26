/**
 * Hook returning the active Theme for the current device color scheme.
 *
 * Wraps RN's `useColorScheme` so screens can write:
 * ```tsx
 * const theme = useTheme();
 * <View style={{ backgroundColor: theme.colors.bg }} />
 * ```
 *
 * Pass `'dark'` or `'light'` to force a mode. Use case: the camera screen
 * forces dark regardless of OS scheme, because TinyBooth runs on a propped-up
 * tablet at dim-lit venues and a white background blasts the room.
 */
import { useColorScheme } from 'react-native';
import { buildTheme, type Theme, type ThemeMode } from './theme';

/**
 * Returns the theme for the current OS color scheme. Defaults to light when
 * the OS does not report a preference. Pass `forceMode` to override.
 *
 * @param forceMode Optional mode to use instead of the OS scheme.
 */
export function useTheme(forceMode?: ThemeMode): Theme {
  const scheme = useColorScheme();
  if (forceMode) return buildTheme(forceMode);
  return buildTheme(scheme === 'dark' ? 'dark' : 'light');
}
