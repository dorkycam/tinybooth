/**
 * Idle auto-close affordance for kiosk screens.
 *
 * Shows a "Closing in Ns" line and a shrinking progress track so a guest can
 * see the booth is about to return to Start. Driven by the values from
 * {@link useIdleReset}: pass the live `secondsLeft` and the configured `total`.
 * Renders nothing when the idle timer is disabled (`secondsLeft` is `null`).
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/** Props for {@link AutoCloseBar}. */
export interface AutoCloseBarProps {
  /** Seconds remaining from {@link useIdleReset}, or `null` when disabled. */
  secondsLeft: number | null;
  /** The full configured timeout in seconds, used to size the progress fill. */
  total: number;
}

/**
 * A countdown line plus progress track for the idle auto-close timer.
 *
 * @returns The rendered bar, or `null` when the timer is disabled.
 */
export function AutoCloseBar({ secondsLeft, total }: AutoCloseBarProps): JSX.Element | null {
  const theme = useTheme();
  if (secondsLeft === null) return null;
  const pct = total > 0 ? Math.round((secondsLeft / total) * 100) : 0;
  return (
    <View style={[styles.bar, { paddingHorizontal: theme.spacing.xl, gap: theme.spacing.xs }]}>
      <Text style={[styles.text, { color: theme.colors.subtle }]}>Closing in {secondsLeft}s</Text>
      <View
        style={[
          styles.track,
          { backgroundColor: theme.colors.hairline, borderRadius: theme.radius.sm },
        ]}
      >
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.colors.primary, borderRadius: theme.radius.sm, width: `${pct}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  track: {
    height: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
