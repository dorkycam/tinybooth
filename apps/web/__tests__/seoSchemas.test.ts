/**
 * Tests for the JSON-LD schema builders. Validates basic shape, not full
 * Schema.org compliance. The bar is: a builder that ships an object that
 * Google can parse, with the required fields per Search Console docs.
 */
import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  articleSchema,
  breadcrumbsSchema,
  mobileApplicationSchema,
  organizationSchema,
  pricingProductSchema,
  softwareApplicationSchema,
  SITE_URL,
} from '../src/components/seo/schemas';

describe('absoluteUrl', () => {
  it('prefixes a path with SITE_URL', () => {
    expect(absoluteUrl('/blog/foo')).toBe(`${SITE_URL}/blog/foo`);
  });
  it('passes through an already-absolute URL', () => {
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x');
  });
  it('inserts a leading slash when missing', () => {
    expect(absoluteUrl('events')).toBe(`${SITE_URL}/events`);
  });
});

describe('organizationSchema', () => {
  const s = organizationSchema();
  it('declares the schema context and Organization type', () => {
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('Organization');
  });
  it('uses the canonical site URL', () => {
    expect(s.url).toBe(SITE_URL);
  });
});

describe('softwareApplicationSchema', () => {
  const s = softwareApplicationSchema();
  it('uses the SoftwareApplication type with PhotoApplication category', () => {
    expect(s['@type']).toBe('SoftwareApplication');
    expect(s.applicationCategory).toBe('PhotoApplication');
  });
  it('declares a free Offer', () => {
    expect(s.offers).toMatchObject({
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    });
  });
});

describe('mobileApplicationSchema', () => {
  it('uses the MobileApplication type', () => {
    expect(mobileApplicationSchema()['@type']).toBe('MobileApplication');
  });
});

describe('breadcrumbsSchema', () => {
  const s = breadcrumbsSchema([
    { name: 'TinyBooth', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]);
  it('builds a numbered itemListElement', () => {
    expect(s['@type']).toBe('BreadcrumbList');
    const items = s.itemListElement as ReadonlyArray<{
      position: number;
      name: string;
      item: string;
    }>;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      position: 1,
      name: 'TinyBooth',
      item: `${SITE_URL}/`,
    });
    expect(items[1]).toMatchObject({
      position: 2,
      name: 'Blog',
      item: `${SITE_URL}/blog`,
    });
  });
});

describe('articleSchema', () => {
  const s = articleSchema({
    title: 'A test post',
    description: 'About something.',
    slug: 'a-test-post',
    datePublished: '2026-01-01',
  });
  it('uses the Article type with the right mainEntityOfPage', () => {
    expect(s['@type']).toBe('Article');
    expect((s.mainEntityOfPage as Record<string, unknown>)['@id']).toBe(
      `${SITE_URL}/blog/a-test-post`,
    );
  });
  it('falls back dateModified to datePublished when omitted', () => {
    expect(s.datePublished).toBe('2026-01-01');
    expect(s.dateModified).toBe('2026-01-01');
  });
  it('honors an explicit dateModified', () => {
    const s2 = articleSchema({
      title: 'A',
      description: 'B',
      slug: 'a',
      datePublished: '2026-01-01',
      dateModified: '2026-02-01',
    });
    expect(s2.dateModified).toBe('2026-02-01');
  });
});

describe('pricingProductSchema', () => {
  const s = pricingProductSchema([
    { name: 'Event Pass', description: 'One event.', priceCents: 1499, sku: 'ep' },
    { name: 'Plus', description: 'Plus.', priceCents: 3900 },
  ]);
  it('builds a Product with the right Offers', () => {
    expect(s['@type']).toBe('Product');
    const offers = s.offers as ReadonlyArray<{ price: string; priceCurrency: string }>;
    expect(offers).toHaveLength(2);
    expect(offers[0]?.price).toBe('14.99');
    expect(offers[0]?.priceCurrency).toBe('USD');
    expect(offers[1]?.price).toBe('39.00');
  });
});
