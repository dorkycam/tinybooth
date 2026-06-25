/**
 * Safe-crop overlay.
 *
 * Sits on top of the live camera preview and shows guests exactly what part of
 * the frame will be saved into the strip. Outside the safe zone is darkened so
 * a guest standing too far left or too low understands they need to recenter.
 *
 * The aspect ratio comes from the active layout's first frame rect (all frames
 * in a layout share the same aspect). The overlay is non-interactive so taps
 * still pass through to the camera screen's tap-to-start handler.
 */
import type { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface SafeCropOverlayProps {
  /** Width / height of the per-frame rect in the layout. */
  frameAspect: number;
  /** Optional accent color for the safe-zone border. Defaults to a translucent white. */
  accent?: string;
}

/**
 * Corner radius of the safe-box border. Kept small so the square-cornered dim
 * hole hugs the rounded outline closely and the residual corner slivers stay
 * negligible.
 */
const SAFE_BOX_RADIUS = 12;

/** Border thickness of the safe box. */
const SAFE_BOX_BORDER = 2;

/**
 * Render the darkened mask + a centered, aspect-correct safe rectangle.
 * Uses absolute positioning so it stretches to the full preview surface.
 *
 * The top/bottom/side masks dim everything around the safe box, leaving the
 * camera inside the rounded outline fully clear.
 */
export function SafeCropOverlay({ frameAspect, accent }: SafeCropOverlayProps): JSX.Element {
  const theme = useTheme('dark');
  const borderColor = accent ?? theme.colors.cropBorder;
  const maskColor = theme.colors.cropMask;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.mask, styles.maskTop, { backgroundColor: maskColor }]} />
      <View style={styles.middleRow}>
        <View style={[styles.mask, styles.maskSide, { backgroundColor: maskColor }]} />
        <View
          style={[
            styles.safeBox,
            { aspectRatio: frameAspect, borderColor },
          ]}
        />
        <View style={[styles.mask, styles.maskSide, { backgroundColor: maskColor }]} />
      </View>
      <View style={[styles.mask, styles.maskBottom, { backgroundColor: maskColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {},
  maskTop: {
    flex: 1,
  },
  maskBottom: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  maskSide: {
    flex: 1,
  },
  safeBox: {
    width: '92%',
    maxWidth: 640,
    borderWidth: SAFE_BOX_BORDER,
    borderRadius: SAFE_BOX_RADIUS,
  },
});
