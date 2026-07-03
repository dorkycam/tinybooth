import { describe, expect, it } from 'vitest';

import { counterBottomOffset } from '../src/lib/cropGeometry';
import { decideFlashMode } from '../src/lib/flashMode';

const OPTIONS = { inBandOffset: 56, margin: 12, boxBorder: 2, gap: 12 };

describe('counterBottomOffset', () => {
  it('keeps the in-band offset when the band clears the pill plus the margin', () => {
    // Phone portrait: a tall bottom band easily seats a 50pt pill above 56pt.
    expect(counterBottomOffset(200, 50, OPTIONS)).toBe(56);
  });

  it('tucks the pill inside the box when the band is too short', () => {
    // iPad landscape: a ~60pt band cannot seat the pill, so tuck it into the box.
    expect(counterBottomOffset(60, 50, OPTIONS)).toBe(60 + 2 + 12);
  });

  it('stays in-band exactly at the clearance threshold', () => {
    // band == inBandOffset + pillHeight + margin (56 + 50 + 12 = 118).
    expect(counterBottomOffset(118, 50, OPTIONS)).toBe(56);
  });

  it('tucks one pixel below the threshold', () => {
    expect(counterBottomOffset(117, 50, OPTIONS)).toBe(117 + 2 + 12);
  });

  it('accounts for a taller two-line pill when deciding to tuck', () => {
    // A 68pt "Get ready!" pill needs 56 + 68 + 12 = 136pt of band to stay in-band.
    expect(counterBottomOffset(120, 68, OPTIONS)).toBe(120 + 2 + 12);
    expect(counterBottomOffset(140, 68, OPTIONS)).toBe(56);
  });
});

describe('decideFlashMode', () => {
  it('lights nothing when the flash setting is off', () => {
    expect(decideFlashMode(true, false)).toEqual({ cameraFlash: 'off', useScreenFlash: false });
    expect(decideFlashMode(false, false)).toEqual({ cameraFlash: 'off', useScreenFlash: false });
  });

  it('fires the real camera flash and suppresses the screen-flash on capable hardware', () => {
    expect(decideFlashMode(true, true)).toEqual({ cameraFlash: 'on', useScreenFlash: false });
  });

  it('runs the screen-flash fill light when the device has no real flash', () => {
    expect(decideFlashMode(false, true)).toEqual({ cameraFlash: 'off', useScreenFlash: true });
  });
});
