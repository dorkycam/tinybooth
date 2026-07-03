/**
 * Crop-frame overlay for the capture screen.
 *
 * Sits on top of the full-bleed live preview and marks the region that will be
 * saved into the strip: a centered box with the layout's cell aspect ratio,
 * with everything outside it dimmed. Unlike a decorative mask, this overlay is
 * the source of truth for the capture crop — it measures itself, reports the
 * box geometry through `onCropChange` as a {@link PreviewCrop}, and the
 * composition bridge crops each photo to exactly that region. Whatever a guest
 * sees inside the box is what lands on the strip.
 *
 * Library-style: non-interactive, owns no booth state; the parent wires the
 * geometry into its capture session.
 */
import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { fitAspectRect, type CropRect, type PreviewCrop, type Size } from '@/lib/cropGeometry';
import { useTheme } from '@/theme/useTheme';

interface CropFrameOverlayProps {
  /** Width / height of the per-frame rect in the layout. */
  frameAspect: number;
  /** Optional accent color for the box border. Defaults to a translucent white. */
  accent?: string;
  /** Reports the measured box geometry whenever it changes. */
  onCropChange: (crop: PreviewCrop) => void;
  /**
   * Reports the measured box as a pixel rect in container coordinates whenever it
   * changes, so the screen can anchor chrome (the frame-counter pill) to it.
   */
  onBoxRectChange?: (rect: CropRect) => void;
}

/** Corner radius of the crop-box border. Kept small so the square-cornered dim
 * hole hugs the rounded outline closely. */
const BOX_RADIUS = 12;

/** Border thickness of the crop box. */
export const BOX_BORDER = 2;

/**
 * Fraction of the largest fitting rectangle the box occupies, leaving a ring of
 * dimmed live camera around it so the screen still reads as all-camera.
 */
const BOX_INSET_FRACTION = 0.88;

/**
 * Render the dim mask + centered crop box, and report its geometry.
 *
 * @param props The target `frameAspect`, optional border `accent`, and the
 *   `onCropChange` geometry callback.
 * @returns The overlay, empty until the preview has been measured.
 */
export function CropFrameOverlay({
  frameAspect,
  accent,
  onCropChange,
  onBoxRectChange,
}: CropFrameOverlayProps): JSX.Element {
  const theme = useTheme('dark');
  const [container, setContainer] = useState<Size | null>(null);
  const borderColor = accent ?? theme.colors.cropBorder;
  const maskColor = theme.colors.cropMask;

  const fitted = container ? fitAspectRect(container, frameAspect) : null;
  const box: Size | null = fitted
    ? { width: fitted.width * BOX_INSET_FRACTION, height: fitted.height * BOX_INSET_FRACTION }
    : null;

  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setContainer((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  // Report the geometry once measured and whenever it changes (e.g. rotation).
  useEffect(() => {
    if (!container) return;
    const fit = fitAspectRect(container, frameAspect);
    if (!fit) return;
    const boxW = fit.width * BOX_INSET_FRACTION;
    const boxH = fit.height * BOX_INSET_FRACTION;
    onCropChange({
      previewAspect: container.width / container.height,
      boxFracW: boxW / container.width,
      boxFracH: boxH / container.height,
    });
    onBoxRectChange?.({
      x: (container.width - boxW) / 2,
      y: (container.height - boxH) / 2,
      width: boxW,
      height: boxH,
    });
  }, [container, frameAspect, onCropChange, onBoxRectChange]);

  if (!container || !box) {
    return <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout} />;
  }

  const sideW = (container.width - box.width) / 2;
  const topH = (container.height - box.height) / 2;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={handleLayout}>
      <View style={[styles.mask, { top: 0, left: 0, right: 0, height: topH, backgroundColor: maskColor }]} />
      <View style={[styles.mask, { bottom: 0, left: 0, right: 0, height: topH, backgroundColor: maskColor }]} />
      <View style={[styles.mask, { top: topH, bottom: topH, left: 0, width: sideW, backgroundColor: maskColor }]} />
      <View style={[styles.mask, { top: topH, bottom: topH, right: 0, width: sideW, backgroundColor: maskColor }]} />
      <View
        style={[
          styles.box,
          { top: topH, left: sideW, width: box.width, height: box.height, borderColor },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    position: 'absolute',
  },
  box: {
    position: 'absolute',
    borderWidth: BOX_BORDER,
    borderRadius: BOX_RADIUS,
  },
});
