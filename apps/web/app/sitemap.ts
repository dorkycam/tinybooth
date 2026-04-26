import type { MetadataRoute } from 'next';
import { ALL_POSTS } from '../src/lib/blog';
import { SITE_URL } from '../src/components/seo';

/**
 * Static marketing routes the site exposes for indexing. Mirrors the
 * cornerstone-page list from docs/research/seo.md section 4. Routes that
 * are noindex (dashboard, wall/new, upload pages) are intentionally
 * excluded so we do not waste crawl budget.
 */
const STATIC_ROUTES: ReadonlyArray<{ path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFreq: 'weekly' },
  { path: '/app', priority: 0.9, changeFreq: 'weekly' },
  { path: '/app/ipad', priority: 0.8, changeFreq: 'monthly' },
  { path: '/app/iphone', priority: 0.8, changeFreq: 'monthly' },
  { path: '/app/android', priority: 0.8, changeFreq: 'monthly' },
  { path: '/app/for-weddings', priority: 0.8, changeFreq: 'monthly' },
  { path: '/app/for-birthdays', priority: 0.7, changeFreq: 'monthly' },
  { path: '/app/for-corporate-events', priority: 0.7, changeFreq: 'monthly' },
  { path: '/wall', priority: 0.9, changeFreq: 'weekly' },
  { path: '/wall/for-weddings', priority: 0.8, changeFreq: 'monthly' },
  { path: '/wall/live-slideshow', priority: 0.7, changeFreq: 'monthly' },
  { path: '/events', priority: 0.7, changeFreq: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFreq: 'monthly' },
  { path: '/about', priority: 0.5, changeFreq: 'yearly' },
  { path: '/contact', priority: 0.5, changeFreq: 'yearly' },
  { path: '/help', priority: 0.7, changeFreq: 'monthly' },
  { path: '/blog', priority: 0.8, changeFreq: 'weekly' },
  { path: '/legal/privacy', priority: 0.3, changeFreq: 'yearly' },
  { path: '/legal/terms', priority: 0.3, changeFreq: 'yearly' },
];

/**
 * Build the absolute URL for a sitemap entry. Used by the static + blog
 * sections.
 */
function urlFor(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * sitemap.xml generator. Combines the static cornerstone routes with the
 * dynamic blog posts (read at build via the blog registry). Updated on
 * each build / ISR.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: urlFor(r.path),
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
  const blogEntries: MetadataRoute.Sitemap = ALL_POSTS.map((p) => ({
    url: urlFor(`/blog/${p.meta.slug}`),
    lastModified: new Date(p.meta.updated ?? p.meta.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));
  return [...staticEntries, ...blogEntries];
}
