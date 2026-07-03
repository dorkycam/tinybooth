/**
 * Capture screen chrome: the bottom status pill over the camera preview.
 *
 * Pure presentational overlay. The capture screen owns all booth state and the
 * exit control (a shared IconButton it renders itself), so this component is just
 * the status pill. It uses scrim/onPrimary theme tokens so nothing is hand-tinted.
 *
 * The screen owns the pill's vertical placement (it depends on the measured crop
 * box, which varies by device and orientation), so the pill's `bottom` arrives as
 * `bottomOffset` and this component reports its own measured height back through
 * `onHeightChange` so the screen's tuck math is exact.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { useTheme } from '@/theme/useTheme';

interface CaptureChromeProps {
  /** Primary line of the status pill (e.g. "Get ready!", "2 / 4"). */
  hint: string;
  /** Optional second line under the hint (e.g. "4 photos . Classic strip"). */
  subhint?: string | null;
  /** The pill's `bottom` offset in pixels, computed by the screen. */
  bottomOffset: number;
  /** Reports the pill's measured height so the screen can place it exactly. */
  onHeightChange?: (height: number) => void;
}

/** The bottom status pill over the camera preview. */
export function CaptureChrome({
  hint,
  subhint,
  bottomOffset,
  onHeightChange,
}: CaptureChromeProps): JSX.Element {
  const theme = useTheme('dark');

  const handleLayout = (event: LayoutChangeEvent): void => {
    onHeightChange?.(event.nativeEvent.layout.height);
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomOffset }]}>
      <GlassSurface
        glassStyle="regular"
        colorScheme="dark"
        fallbackColor={theme.colors.scrim}
        style={styles.bottomHint}
      >
        <View onLayout={handleLayout} style={styles.pill}>
          <Text style={[styles.bottomHintText, { color: theme.colors.onPrimary }]}>{hint}</Text>
          {subhint ? (
            <Text style={[styles.bottomHintSub, { color: theme.colors.onPrimary }]}>{subhint}</Text>
          ) : null}
        </View>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomHint: {
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  pill: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
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
