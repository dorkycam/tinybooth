'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QROverlayProps {
  uploadUrl: string;
  /** Foreground used for the QR module color. Defaults to white. */
  accentColor?: string;
}

/**
 * Fixed-position QR overlay for the TV display. Bottom-right corner. Lifts
 * over the photo grid so it never gets buried under tiles. Honors event
 * branding when an accent color is supplied.
 */
export function QROverlay({ uploadUrl, accentColor }: QROverlayProps): JSX.Element {
  const fg = accentColor && accentColor.length > 0 ? accentColor : '#ffffff';
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2 rounded-2xl px-4 py-3 backdrop-blur"
      style={{ background: 'rgba(0, 0, 0, 0.75)' }}
    >
      <QRCodeSVG value={uploadUrl} size={120} bgColor="transparent" fgColor={fg} level="M" />
      <span className="text-white text-sm font-semibold">Post a pic!</span>
    </div>
  );
}
