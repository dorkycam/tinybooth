/**
 * Capture screen chrome: the exit button (top-left) and the status pill (bottom).
 *
 * Pure presentational overlay that sits above the camera preview. The capture
 * screen owns all booth state and passes in what to show plus the exit callback.
 * Both pieces use scrim/onPrimary theme tokens so nothing is hand-tinted here.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface CaptureChromeProps {
  /** Primary line of the status pill (e.g. "Tap anywhere to start", "2 / 4"). */
  hint: string;
  /** Optional second line under the hint (e.g. "4 photos . Classic strip"). */
  subhint?: string | null;
  /** Called when the guest taps the exit control. */
  onExit: () => void;
}

/** Top exit control plus the bottom status pill over the camera preview. */
export function CaptureChrome({ hint, subhint, onExit }: CaptureChromeProps): JSX.Element {
  const theme = useTheme('dark');
  return (
    <>
      <View pointerEvents="box-none" style={styles.topBar}>
        <Pressable
          onPress={onExit}
          accessibilityRole="button"
          accessibilityLabel="Exit the booth"
          hitSlop={16}
          style={[styles.exitButton, { backgroundColor: theme.colors.scrim }]}
        >
          <Text style={[styles.exitIcon, { color: theme.colors.onPrimary }]}>{'✕'}</Text>
        </Pressable>
        <View />
      </View>

      <View
        pointerEvents="none"
        style={[styles.bottomHint, { backgroundColor: theme.colors.scrim }]}
      >
        <Text style={[styles.bottomHintText, { color: theme.colors.onPrimary }]}>{hint}</Text>
        {subhint ? (
          <Text style={[styles.bottomHintSub, { color: theme.colors.onPrimary }]}>{subhint}</Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitIcon: {
    fontSize: 20,
    fontWeight: '700',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
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
