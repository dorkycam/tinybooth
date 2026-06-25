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
 * Corner radius shared by the safe-box border and the corner mask fills, so the
 * dim mask's inner opening always curves with the same arc as the border. If
 * these drift apart, clear triangles reappear at the corners.
 */
const SAFE_BOX_RADIUS = 16;

/** Border thickness of the safe box, also used to offset the corner fills. */
const SAFE_BOX_BORDER = 2;

/**
 * Render the darkened mask + a centered, aspect-correct safe rectangle.
 * Uses absolute positioning so it stretches to the full preview surface.
 *
 * The top/bottom/side masks form a square-cornered hole, but the safe box has
 * rounded corners, which would leave a clear triangle of camera at each corner.
 * Four corner fills (mask color, inner corner rounded by SAFE_BOX_RADIUS) sit at
 * the safe box's corners to cover those triangles flush with the border arc.
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
        >
          <View
            style={[styles.corner, styles.cornerTopLeft, { backgroundColor: maskColor }]}
          />
          <View
            style={[styles.corner, styles.cornerTopRight, { backgroundColor: maskColor }]}
          />
          <View
            style={[styles.corner, styles.cornerBottomLeft, { backgroundColor: maskColor }]}
          />
          <View
            style={[styles.corner, styles.cornerBottomRight, { backgroundColor: maskColor }]}
          />
        </View>
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
  corner: {
    position: 'absolute',
    width: SAFE_BOX_RADIUS,
    height: SAFE_BOX_RADIUS,
  },
  cornerTopLeft: {
    top: -SAFE_BOX_BORDER,
    left: -SAFE_BOX_BORDER,
    borderBottomRightRadius: SAFE_BOX_RADIUS,
  },
  cornerTopRight: {
    top: -SAFE_BOX_BORDER,
    right: -SAFE_BOX_BORDER,
    borderBottomLeftRadius: SAFE_BOX_RADIUS,
  },
  cornerBottomLeft: {
    bottom: -SAFE_BOX_BORDER,
    left: -SAFE_BOX_BORDER,
    borderTopRightRadius: SAFE_BOX_RADIUS,
  },
  cornerBottomRight: {
    bottom: -SAFE_BOX_BORDER,
    right: -SAFE_BOX_BORDER,
    borderTopLeftRadius: SAFE_BOX_RADIUS,
  },
});
