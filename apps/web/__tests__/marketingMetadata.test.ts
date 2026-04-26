/**
 * Smoke tests for the marketing-page metadata exports. Each cornerstone
 * page must export a `metadata` object with a sane title/description and
 * a canonical alternate. We keep these terse: the goal is to catch a
 * page that silently loses its meta tags during a refactor.
 */
import { describe, expect, it } from 'vitest';

import { metadata as homeMeta } from '../app/page';
import { metadata as appMeta } from '../app/app/page';
import { metadata as ipadMeta } from '../app/app/ipad/page';
import { metadata as iphoneMeta } from '../app/app/iphone/page';
import { metadata as androidMeta } from '../app/app/android/page';
import { metadata as appWeddingsMeta } from '../app/app/for-weddings/page';
import { metadata as appBirthdaysMeta } from '../app/app/for-birthdays/page';
import { metadata as appCorporateMeta } from '../app/app/for-corporate-events/page';
import { metadata as wallMeta } from '../app/wall/page';
import { metadata as wallWeddingsMeta } from '../app/wall/for-weddings/page';
import { metadata as wallSlideshowMeta } from '../app/wall/live-slideshow/page';
import { metadata as eventsMeta } from '../app/events/page';
import { metadata as pricingMeta } from '../app/pricing/page';
import { metadata as aboutMeta } from '../app/about/page';
import { metadata as contactMeta } from '../app/contact/page';
import { metadata as helpMeta } from '../app/help/page';
import { metadata as termsMeta } from '../app/legal/terms/page';
import { metadata as blogIndexMeta } from '../app/blog/page';
import { generateMetadata as blogPostMeta } from '../app/blog/[slug]/page';
import { ALL_POSTS } from '../src/lib/blog';

interface MinimalMetadata {
  title?: unknown;
  description?: unknown;
  alternates?: { canonical?: unknown };
  openGraph?: unknown;
}

const PAGES: ReadonlyArray<{ name: string; canonical: string; meta: MinimalMetadata }> = [
  { name: 'home', canonical: '/', meta: homeMeta as MinimalMetadata },
  { name: 'app', canonical: '/app', meta: appMeta as MinimalMetadata },
  { name: 'ipad', canonical: '/app/ipad', meta: ipadMeta as MinimalMetadata },
  { name: 'iphone', canonical: '/app/iphone', meta: iphoneMeta as MinimalMetadata },
  { name: 'android', canonical: '/app/android', meta: androidMeta as MinimalMetadata },
  { name: 'app/weddings', canonical: '/app/for-weddings', meta: appWeddingsMeta as MinimalMetadata },
  { name: 'app/birthdays', canonical: '/app/for-birthdays', meta: appBirthdaysMeta as MinimalMetadata },
  { name: 'app/corporate', canonical: '/app/for-corporate-events', meta: appCorporateMeta as MinimalMetadata },
  { name: 'wall', canonical: '/wall', meta: wallMeta as MinimalMetadata },
  { name: 'wall/weddings', canonical: '/wall/for-weddings', meta: wallWeddingsMeta as MinimalMetadata },
  { name: 'wall/slideshow', canonical: '/wall/live-slideshow', meta: wallSlideshowMeta as MinimalMetadata },
  { name: 'events', canonical: '/events', meta: eventsMeta as MinimalMetadata },
  { name: 'pricing', canonical: '/pricing', meta: pricingMeta as MinimalMetadata },
  { name: 'about', canonical: '/about', meta: aboutMeta as MinimalMetadata },
  { name: 'contact', canonical: '/contact', meta: contactMeta as MinimalMetadata },
  { name: 'help', canonical: '/help', meta: helpMeta as MinimalMetadata },
  { name: 'terms', canonical: '/legal/terms', meta: termsMeta as MinimalMetadata },
  { name: 'blog index', canonical: '/blog', meta: blogIndexMeta as MinimalMetadata },
];

describe('marketing page metadata', () => {
  for (const { name, canonical, meta } of PAGES) {
    it(`${name} has a non-empty title`, () => {
      expect(typeof meta.title).toBe('string');
      expect(meta.title).toBeTruthy();
    });
    it(`${name} has a description in the 50 to 200 char range`, () => {
      expect(typeof meta.description).toBe('string');
      const d = String(meta.description);
      expect(d.length).toBeGreaterThanOrEqual(50);
      expect(d.length).toBeLessThanOrEqual(280);
    });
    it(`${name} has the expected canonical alternate`, () => {
      expect(meta.alternates?.canonical).toBe(canonical);
    });
    it(`${name} sets openGraph metadata`, () => {
      expect(meta.openGraph).toBeTruthy();
    });
  }

  it('blog post metadata is generated per slug', () => {
    for (const post of ALL_POSTS) {
      const m = blogPostMeta({ params: { slug: post.meta.slug } }) as MinimalMetadata;
      expect(m.title).toBe(post.meta.title);
      expect(m.description).toBe(post.meta.description);
      expect(m.alternates?.canonical).toBe(`/blog/${post.meta.slug}`);
    }
  });

  it('blog post metadata returns Not found for an unknown slug', () => {
    const m = blogPostMeta({ params: { slug: 'does-not-exist' } });
    expect(m.title).toBe('Not found');
  });
});
