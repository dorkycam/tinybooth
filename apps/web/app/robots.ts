import type { MetadataRoute } from 'next';
import { SITE_URL } from '../src/components/seo';

/**
 * robots.txt generator. Allow everything except authenticated, internal,
 * and per-event routes that should not appear in search. Always include
 * the sitemap line so crawlers discover the index quickly.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/api/',
          // Per-event TinyWall pages (the wall display + the guest upload form).
          // These are accessed via QR codes and have no SEO value as random URLs.
          '/wall/new',
          '/wall/*/upload',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
