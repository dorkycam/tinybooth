import type { MetadataRoute } from 'next';

/**
 * PWA manifest. Theme color matches the brand Paper background; background
 * color matches Cream. Icons are placeholders (Camrynn drops in real PNGs
 * once Phase 5 design assets are exported); the routes are still wired so
 * Lighthouse PWA checks pass.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TinyBooth',
    short_name: 'TinyBooth',
    description:
      'A tablet-first photobooth app and a no-app guest photo wall for events.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF7EE',
    theme_color: '#FBF7EE',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
