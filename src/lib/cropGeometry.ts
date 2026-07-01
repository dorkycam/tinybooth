/**
 * Capture crop geometry: pure math shared by the capture screen's crop-frame
 * overlay and the Skia composition bridge.
 *
 * The booth is WYSIWYG in the "capture follows the preview" direction: the live
 * camera fills the screen edge-to-edge (resize mode "cover"), the overlay draws
 * a centered box with the layout's cell aspect ratio, and composition crops each
 * photo to exactly the region that was visible inside that box. That works for
 * every screen/orientation/layout combination — unlike projecting a fixed
 * center-crop onto the preview, which can extend past the screen edges (e.g.
 * the wide Classic cell on a portrait tablet).
 *
 * The mapping assumes the camera's preview feed and its captured photo share an
 * aspect ratio (the 4:3 default on the supported devices), so the preview's
 * "cover" crop and the photo's "cover" crop resolve to the same region.
 *
 * All functions are pure so they can be unit tested without the React Native or
 * Skia runtime.
 */

/** A pixel rectangle, matching the shape Skia's drawImageRect expects. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A measured width/height pair. */
export interface Size {
  width: number;
  height: number;
}

/**
 * Where the capture crop sits inside the live preview, as fractions of the
 * measured preview. Produced by the crop-frame overlay, consumed by the
 * composition bridge to crop each photo to the same region.
 */
export interface PreviewCrop {
  /** Width / height of the measured preview container. */
  previewAspect: number;
  /** Crop box width as a fraction (0..1] of the preview width. */
  boxFracW: number;
  /** Crop box height as a fraction (0..1] of the preview height. */
  boxFracH: number;
}

/**
 * The largest rectangle of the given aspect ratio that fits inside `container`.
 *
 * @param container The available space.
 * @param aspect Target width / height ratio.
 * @returns The fitted size, or null when the container is degenerate.
 */
export function fitAspectRect(container: Size, aspect: number): Size | null {
  if (container.width <= 0 || container.height <= 0 || aspect <= 0) return null;
  const heightAtFullWidth = container.width / aspect;
  if (heightAtFullWidth <= container.height) {
    return { width: container.width, height: heightAtFullWidth };
  }
  return { width: container.height * aspect, height: container.height };
}

/**
 * Compute the source rectangle that center-crops a shot to the destination
 * aspect ratio, so the shot fills the destination without distortion.
 *
 * @param srcW Source image width in pixels.
 * @param srcH Source image height in pixels.
 * @param dstW Destination width (only the dstW/dstH ratio matters).
 * @param dstH Destination height (only the dstW/dstH ratio matters).
 * @returns The crop rectangle in source-image pixels.
 */
export function centeredCropRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): CropRect {
  const targetAspect = dstW / dstH;
  const srcAspect = srcW / srcH;
  let cropW: number;
  let cropH: number;
  if (srcAspect > targetAspect) {
    cropH = srcH;
    cropW = Math.floor(srcH * targetAspect);
  } else {
    cropW = srcW;
    cropH = Math.floor(srcW / targetAspect);
  }
  const x = Math.floor((srcW - cropW) / 2);
  const y = Math.floor((srcH - cropH) / 2);
  return { x, y, width: cropW, height: cropH };
}

/**
 * Map the capture screen's crop box back onto a captured photo.
 *
 * The live preview shows the photo "cover"-cropped to the preview's aspect
 * ratio; the crop box is a centered sub-rectangle of that visible region. This
 * returns the photo-pixel rectangle corresponding to the box: the cover-visible
 * region shrunk by the box's width/height fractions, still centered (the box is
 * centered on screen, so the mapping is unaffected by preview mirroring).
 *
 * @param srcW Photo width in pixels.
 * @param srcH Photo height in pixels.
 * @param crop The box geometry measured on the capture screen.
 * @returns The crop rectangle in photo pixels.
 */
export function previewCropRect(srcW: number, srcH: number, crop: PreviewCrop): CropRect {
  const visible = centeredCropRect(srcW, srcH, crop.previewAspect, 1);
  const width = Math.floor(visible.width * crop.boxFracW);
  const height = Math.floor(visible.height * crop.boxFracH);
  const x = Math.floor((srcW - width) / 2);
  const y = Math.floor((srcH - height) / 2);
  return { x, y, width, height };
}
