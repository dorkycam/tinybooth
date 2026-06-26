/**
 * Full-screen JS splash shown while the app hydrates. A solid dark background
 * with the lowercase white wordmark centered, matching the native splash so the
 * handoff is seamless. No spinner, no logo.
 */
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/theme/useTheme';

/**
 * Render the branded splash: the white wordmark centered on the dark brand
 * background. Presentational only; the parent decides when to mount it.
 */
export function AppSplash(): JSX.Element {
  const theme = useTheme('dark');
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <Wordmark size="lg" style={{ color: theme.colors.flash }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
