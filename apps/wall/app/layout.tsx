import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'TinyWall by TinyBooth',
  description: 'Live photo wall for parties. Guests scan a QR code and upload photos to the TV.',
};

/**
 * Root layout for the TinyWall TV display + guest upload page. Kept separate
 * from the marketing app so the TV view can run with looser middleware and a
 * different CSP for embedded media.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
