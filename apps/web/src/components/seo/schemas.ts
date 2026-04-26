/**
 * Schema.org JSON-LD builders. Each function returns a plain object that
 * is rendered by `<JsonLd />`. Builders are pure so tests can assert their
 * output without spinning up a React tree.
 *
 * Per `docs/research/seo.md` section 6: skip `FAQPage` schema (no longer
 * gets rich results in 2026) and skip `HowTo` schema (Google removed those
 * rich results too). FAQ content lives in `<dl>` markup instead.
 */

export const SITE_URL = 'https://tinybooth.com';

/**
 * Build the canonical absolute URL for a route. Uses `SITE_URL` so SSR and
 * client renders agree.
 *
 * @param path Path relative to the site root, e.g. `/app/ipad`.
 */
export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (!path.startsWith('/')) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}

/** Brand-level Organization schema. Goes in the root layout. */
export function organizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TinyBooth',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: [
      'https://apps.apple.com/us/app/tinybooth/id1519858905',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'hello@tinybooth.com',
        contactType: 'customer support',
        areaServed: 'US',
        availableLanguage: ['English'],
      },
    ],
  };
}

/** Generic SoftwareApplication schema for the cross-platform TinyBooth app. */
export function softwareApplicationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TinyBooth',
    operatingSystem: 'iOS, Android',
    applicationCategory: 'PhotoApplication',
    url: `${SITE_URL}/app`,
    description:
      'TinyBooth is a tablet-first photobooth app. Free with all layouts, AirPrint, and the random message library. Pair with TinyWall for a guest photo wall.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TinyBooth',
    },
  };
}

/** Apple-specific MobileApplication schema. */
export function mobileApplicationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'TinyBooth',
    operatingSystem: 'iOS 16+',
    applicationCategory: 'PhotoApplication',
    url: 'https://apps.apple.com/us/app/tinybooth/id1519858905',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}

/** A breadcrumb item; passed to `breadcrumbsSchema`. */
export interface BreadcrumbItem {
  name: string;
  /** Path relative to the site root. */
  path: string;
}

/** BreadcrumbList schema. */
export function breadcrumbsSchema(items: readonly BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Article schema for blog posts. */
export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  /** ISO 8601 date string. */
  datePublished: string;
  /** ISO 8601 date string. Defaults to `datePublished`. */
  dateModified?: string;
  authorName?: string;
  /** Optional hero image absolute URL. */
  imageUrl?: string;
}

export function articleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/blog/${input.slug}`),
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: {
      '@type': 'Person',
      name: input.authorName ?? 'Camrynn Dilley',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TinyBooth',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
  };
}

/** A single product offering for the pricing page schema. */
export interface ProductOffer {
  name: string;
  description: string;
  priceCents: number;
  /** Optional SKU id. */
  sku?: string;
}

/**
 * Product schema for /pricing. Renders one Product with three nested
 * Offers, one per tier. Keeps the Search Console tree tidy.
 */
export function pricingProductSchema(offers: readonly ProductOffer[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'TinyBooth Event Passes',
    description:
      'TinyBooth pricing for events: free, Event Pass, and Event Pass Plus. One-time per event, no subscription.',
    brand: { '@type': 'Brand', name: 'TinyBooth' },
    offers: offers.map((o) => ({
      '@type': 'Offer',
      name: o.name,
      description: o.description,
      price: (o.priceCents / 100).toFixed(2),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      ...(o.sku ? { sku: o.sku } : {}),
      url: `${SITE_URL}/pricing`,
    })),
  };
}
