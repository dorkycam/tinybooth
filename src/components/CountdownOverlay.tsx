/**
 * Big translucent countdown digit shown over the camera preview.
 *
 * Pure presentational component; the camera screen owns the timer and feeds
 * us the current digit (3, 2, 1) plus the random message for the post-capture
 * reveal. We render the digit when `digit !== null`, otherwise the message.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CountdownOverlayProps {
  /** Countdown digit to show. Null to hide the digit. */
  digit: number | null;
  /** Random message to show after capture. Null to hide the message. */
  message: string | null;
}

/** Renders either the countdown digit or the post-capture random message. */
export function CountdownOverlay({ digit, message }: CountdownOverlayProps): JSX.Element | null {
  const theme = useTheme();
  if (digit === null && message === null) {
    return null;
  }
  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={[styles.bubble, { backgroundColor: 'rgba(15, 18, 22, 0.78)' }]}>
        {digit !== null ? (
          <Text style={[styles.digit, { color: theme.colors.bg }]}>{digit}</Text>
        ) : (
          <Text style={[styles.message, { color: theme.colors.bg }]}>{message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingHorizontal: 48,
    paddingVertical: 24,
    borderRadius: 32,
    minWidth: 180,
    alignItems: 'center',
  },
  digit: {
    fontSize: 132,
    fontWeight: '800',
    lineHeight: 144,
  },
  message: {
    fontSize: 56,
    fontWeight: '600',
    textAlign: 'center',
  },
});
