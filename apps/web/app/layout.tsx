import type { Metadata, Viewport } from 'next';
import { Manrope, Caveat } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { JsonLd, organizationSchema, SITE_URL } from '../src/components/seo';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
});

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-caveat',
});

export const viewport: Viewport = {
  themeColor: '#FBF7EE',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TinyBooth - tablet photo booth app + party photo wall',
    template: '%s - TinyBooth',
  },
  description:
    'TinyBooth is a tablet-first photobooth app and a no-app guest photo wall. Free for personal use, $14.99 for an event with branding, retention, and the wall combined.',
  applicationName: 'TinyBooth',
  authors: [{ name: 'Camrynn Dilley' }],
  generator: 'Next.js',
  keywords: [
    'photo booth app',
    'photobooth app',
    'iPad photo booth',
    'wedding photo wall',
    'qr code wedding photos',
    'live photo slideshow',
    'AirPrint photo booth',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'TinyBooth',
    title: 'TinyBooth - tablet photo booth app + party photo wall',
    description:
      'A tablet-first photobooth app and a no-app guest photo wall, in one event. Free to start, no account.',
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinyBooth - tablet photo booth app + party photo wall',
    description:
      'Free tablet-first photo booth + a guest photo wall. One event, both products, one dashboard.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

/**
 * Root layout for the marketing site, dashboard, and APIs. Loads Manrope
 * (UI/body) and Caveat (handwritten accents per brand identity) once and
 * exposes both as CSS variables. Emits the Organization JSON-LD here so it
 * appears on every page.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${manrope.variable} ${caveat.variable}`}>
      <body>
        <JsonLd data={organizationSchema()} />
        {children}
      </body>
    </html>
  );
}
