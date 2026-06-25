/**
 * Capture screen chrome: the bottom status pill over the camera preview.
 *
 * Pure presentational overlay. The capture screen owns all booth state and the
 * exit control (a shared IconButton it renders itself), so this component is just
 * the status pill. It uses scrim/onPrimary theme tokens so nothing is hand-tinted.
 */
import type { JSX } from 'react';
import { StyleSheet, Text } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { useTheme } from '@/theme/useTheme';

interface CaptureChromeProps {
  /** Primary line of the status pill (e.g. "Get ready!", "2 / 4"). */
  hint: string;
  /** Optional second line under the hint (e.g. "4 photos . Classic strip"). */
  subhint?: string | null;
}

/** The bottom status pill over the camera preview. */
export function CaptureChrome({ hint, subhint }: CaptureChromeProps): JSX.Element {
  const theme = useTheme('dark');
  return (
    <GlassSurface
      glassStyle="regular"
      colorScheme="dark"
      fallbackColor={theme.colors.scrim}
      style={styles.bottomHint}
    >
      <Text style={[styles.bottomHintText, { color: theme.colors.onPrimary }]}>{hint}</Text>
      {subhint ? (
        <Text style={[styles.bottomHintSub, { color: theme.colors.onPrimary }]}>{subhint}</Text>
      ) : null}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  bottomHint: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bottomHintText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bottomHintSub: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.85,
  },
});
