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

interface SafeCropOverlayProps {
  /** Width / height of the per-frame rect in the layout. */
  frameAspect: number;
  /** Optional accent color for the safe-zone border. Defaults to white. */
  accent?: string;
}

/**
 * Render the darkened mask + a centered, aspect-correct safe rectangle.
 * Uses absolute positioning so it stretches to the full preview surface.
 */
export function SafeCropOverlay({ frameAspect, accent }: SafeCropOverlayProps): JSX.Element {
  const borderColor = accent ?? 'rgba(255, 255, 255, 0.85)';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.mask, styles.maskTop]} />
      <View style={styles.middleRow}>
        <View style={[styles.mask, styles.maskSide]} />
        <View
          style={[
            styles.safeBox,
            { aspectRatio: frameAspect, borderColor },
          ]}
        />
        <View style={[styles.mask, styles.maskSide]} />
      </View>
      <View style={[styles.mask, styles.maskBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
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
    borderWidth: 2,
    borderRadius: 16,
  },
});
