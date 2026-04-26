/**
 * Tests for the sitemap and robots generators. Confirms that:
 *  - sitemap includes the cornerstone marketing routes,
 *  - sitemap includes one entry per blog post slug,
 *  - robots disallows the noindex paths and includes the sitemap line.
 */
import { describe, expect, it } from 'vitest';
import sitemap from '../app/sitemap';
import robots from '../app/robots';
import { ALL_POSTS } from '../src/lib/blog';
import { SITE_URL } from '../src/components/seo';

describe('sitemap', () => {
  const entries = sitemap();

  it('includes the homepage with priority 1', () => {
    const home = entries.find((e) => e.url === `${SITE_URL}/`);
    expect(home).toBeTruthy();
    expect(home?.priority).toBe(1.0);
  });

  it('includes every cornerstone marketing route', () => {
    const expected = [
      '/app',
      '/app/ipad',
      '/app/iphone',
      '/app/android',
      '/app/for-weddings',
      '/app/for-birthdays',
      '/app/for-corporate-events',
      '/wall',
      '/wall/for-weddings',
      '/wall/live-slideshow',
      '/events',
      '/pricing',
      '/about',
      '/contact',
      '/help',
      '/blog',
      '/legal/privacy',
      '/legal/terms',
    ];
    for (const path of expected) {
      const match = entries.find((e) => e.url === `${SITE_URL}${path}`);
      expect(match, `missing sitemap entry for ${path}`).toBeTruthy();
    }
  });

  it('includes every blog post by slug', () => {
    for (const post of ALL_POSTS) {
      const match = entries.find((e) => e.url === `${SITE_URL}/blog/${post.meta.slug}`);
      expect(match, `missing blog entry for ${post.meta.slug}`).toBeTruthy();
    }
  });

  it('does not include the dashboard or any /api route', () => {
    const bad = entries.find((e) =>
      e.url.includes('/dashboard') || e.url.includes('/api/'),
    );
    expect(bad).toBeUndefined();
  });
});

describe('robots', () => {
  const r = robots();

  it('exposes the sitemap line', () => {
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('disallows /dashboard, /api, and the per-event upload paths', () => {
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule).toBeTruthy();
    if (!rule) return;
    const disallow = rule.disallow;
    const list = typeof disallow === 'string' ? [disallow] : (disallow ?? []);
    expect(list).toContain('/dashboard');
    expect(list).toContain('/api/');
    expect(list).toContain('/wall/new');
    expect(list).toContain('/wall/*/upload');
  });
});
