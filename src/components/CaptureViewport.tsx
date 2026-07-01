/**
 * Capture viewport: a centered, aspect-locked frame for the live preview.
 *
 * The composition step center-crops every captured photo to the layout's single
 * cell aspect ratio (`frameAspect`, see `skiaBridge.centeredCropRect`). To make
 * the booth WYSIWYG, this frame locks the live preview to that exact aspect ratio
 * and clips it, so whatever the guest sees inside the bordered box is what lands
 * on the strip. Previously the preview was full-bleed with a small decorative
 * box drawn on top, so the box always under-represented the captured area.
 *
 * The frame grows to the largest `frameAspect` rectangle that fits the available
 * space and is centered; the surrounding area is left to the (dark) screen
 * background, which is now honest — that region genuinely is not captured.
 * Children (the camera surface, the just-captured peek, the countdown) render
 * inside the clipped frame.
 *
 * Assumes the camera's preview feed and its captured photo share an aspect ratio
 * (true for the front-camera 4:3 default on the supported tablets), so the
 * "cover" preview crop and the composition crop resolve to the same region.
 */
import type { JSX, ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface CaptureViewportProps {
  /** Width / height of the per-frame rect the preview is locked to. */
  frameAspect: number;
  /** Accent color for the frame border. Defaults to a translucent white. */
  accent?: string;
  /** Live preview and its overlays, rendered clipped inside the frame. */
  children: ReactNode;
}

/** Corner radius of the framed preview. */
const FRAME_RADIUS = 12;

/** Border thickness of the framed preview. */
const FRAME_BORDER = 2;

/** A measured pixel size. */
interface Size {
  width: number;
  height: number;
}

/**
 * The largest rectangle of the given aspect ratio that fits inside `container`,
 * centered. Returns null until the container has a non-zero measured size.
 *
 * @param container The measured available space.
 * @param aspect Target width / height ratio.
 * @returns The fitted frame size, or null when the container is unmeasured.
 */
function fitAspect(container: Size, aspect: number): Size | null {
  if (container.width <= 0 || container.height <= 0) return null;
  const widthLimited: Size = { width: container.width, height: container.width / aspect };
  if (widthLimited.height <= container.height) return widthLimited;
  return { width: container.height * aspect, height: container.height };
}

/**
 * Render children inside a centered, aspect-locked, clipped frame.
 *
 * @param props The target `frameAspect`, optional border `accent`, and children.
 * @returns The framed viewport, or an empty container until it is measured.
 */
export function CaptureViewport({ frameAspect, accent, children }: CaptureViewportProps): JSX.Element {
  const theme = useTheme('dark');
  const [container, setContainer] = useState<Size | null>(null);
  const borderColor = accent ?? theme.colors.cropBorder;
  const frame = container ? fitAspect(container, frameAspect) : null;

  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    setContainer((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  return (
    <View style={styles.root} onLayout={handleLayout}>
      {frame ? (
        <View style={[styles.frame, { width: frame.width, height: frame.height, borderColor }]}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    overflow: 'hidden',
    borderWidth: FRAME_BORDER,
    borderRadius: FRAME_RADIUS,
  },
});
