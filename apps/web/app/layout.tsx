import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'TinyBooth',
  description: 'A small, sharp photobooth app and a no-app guest photo wall.',
};

/**
 * Root layout for the marketing site, dashboard, and APIs. Manrope is loaded
 * once and exposed as a CSS variable so child pages can use it without
 * re-declaring the font.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
