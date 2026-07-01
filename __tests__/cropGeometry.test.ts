import { describe, expect, it } from 'vitest';

import {
  centeredCropRect,
  fitAspectRect,
  previewCropRect,
  type PreviewCrop,
} from '../src/lib/cropGeometry';
import { frameAspectForLayout } from '../src/lib/layouts';

describe('fitAspectRect', () => {
  it('fills the width when the container is taller than the aspect', () => {
    expect(fitAspectRect({ width: 800, height: 1200 }, 2)).toEqual({ width: 800, height: 400 });
  });

  it('fills the height when the container is wider than the aspect', () => {
    expect(fitAspectRect({ width: 1200, height: 400 }, 2)).toEqual({ width: 800, height: 400 });
  });

  it('matches the container exactly when aspects agree', () => {
    expect(fitAspectRect({ width: 400, height: 300 }, 4 / 3)).toEqual({ width: 400, height: 300 });
  });

  it('returns null for a degenerate container or aspect', () => {
    expect(fitAspectRect({ width: 0, height: 300 }, 1)).toBeNull();
    expect(fitAspectRect({ width: 400, height: 0 }, 1)).toBeNull();
    expect(fitAspectRect({ width: 400, height: 300 }, 0)).toBeNull();
  });
});

describe('centeredCropRect', () => {
  it('crops the sides of a source wider than the target', () => {
    expect(centeredCropRect(4000, 3000, 1, 1)).toEqual({ x: 500, y: 0, width: 3000, height: 3000 });
  });

  it('crops the top and bottom of a source taller than the target', () => {
    expect(centeredCropRect(3000, 4000, 3, 2)).toEqual({ x: 0, y: 1000, width: 3000, height: 2000 });
  });

  it('keeps the whole source when aspects already match', () => {
    expect(centeredCropRect(4000, 3000, 4, 3)).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
  });
});

describe('previewCropRect', () => {
  it('equals the cover-visible region when the box fills the preview', () => {
    const crop: PreviewCrop = { previewAspect: 3 / 4, boxFracW: 1, boxFracH: 1 };
    expect(previewCropRect(4000, 3000, crop)).toEqual(centeredCropRect(4000, 3000, 3, 4));
  });

  it('shrinks the visible region by the box fractions, centered', () => {
    // Photo and preview share a 4:3 aspect, so the whole photo is visible.
    const crop: PreviewCrop = { previewAspect: 4 / 3, boxFracW: 0.5, boxFracH: 0.5 };
    expect(previewCropRect(4000, 3000, crop)).toEqual({
      x: 1000,
      y: 750,
      width: 2000,
      height: 1500,
    });
  });

  it('accounts for the preview cover-crop before applying the box fractions', () => {
    // Portrait preview (3:4) over a landscape 4:3 photo: only the center
    // 2250x3000 of the photo is visible, and the box takes 80% x 60% of that.
    const crop: PreviewCrop = { previewAspect: 3 / 4, boxFracW: 0.8, boxFracH: 0.6 };
    expect(previewCropRect(4000, 3000, crop)).toEqual({
      x: 1100,
      y: 600,
      width: 1800,
      height: 1800,
    });
  });

  it('preserves the crop-box aspect ratio for both shipped layouts', () => {
    // A box built for a layout's cell aspect must crop to that same aspect so
    // the composition never distorts. Simulate the overlay's math on two
    // preview shapes (landscape and portrait tablet).
    for (const layout of ['classic', 'quad'] as const) {
      const frameAspect = frameAspectForLayout(layout);
      for (const preview of [
        { width: 1180, height: 820 },
        { width: 820, height: 1180 },
      ]) {
        const fit = fitAspectRect(preview, frameAspect);
        expect(fit).not.toBeNull();
        if (!fit) continue;
        const crop: PreviewCrop = {
          previewAspect: preview.width / preview.height,
          boxFracW: (fit.width * 0.88) / preview.width,
          boxFracH: (fit.height * 0.88) / preview.height,
        };
        const rect = previewCropRect(4032, 3024, crop);
        expect(rect.width / rect.height).toBeCloseTo(frameAspect, 2);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(4032);
        expect(rect.y + rect.height).toBeLessThanOrEqual(3024);
      }
    }
  });
});
