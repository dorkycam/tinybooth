/**
 * Blog post registry.
 *
 * Implementation choice: posts are TypeScript modules under `content/blog/`
 * that export a typed `post` object with `meta` (frontmatter) and a `Body`
 * React component. We considered MDX (next-mdx-remote and @next/mdx) and
 * picked plain TSX modules instead because:
 *
 *   1. Zero new runtime dependencies. Phase 4 already pulls in plenty.
 *   2. Type-safe frontmatter at the import site. No frontmatter parsing
 *      lib, no schema validation step.
 *   3. Works out of the box with Next.js App Router server components.
 *      Each post is a server-rendered page; the `Body` is just JSX.
 *
 * The trade-off is that authors write JSX-flavored markup instead of
 * MDX-flavored markdown. The blog is for hand-crafted long-form posts so
 * this is fine; if we ever invite guest writers we can migrate to MDX.
 */
import type { ReactNode } from 'react';

/** Frontmatter shape every post must export. */
export interface PostMeta {
  /** URL slug. Must match the file name (sans `.tsx`). */
  slug: string;
  /** Page title; also used in OpenGraph. */
  title: string;
  /** Meta description; 130 to 160 chars is best. */
  description: string;
  /** ISO 8601 date string of original publication. */
  date: string;
  /** ISO 8601 date string of last edit. Defaults to `date` when omitted. */
  updated?: string;
  /** Comma-separated keyword list. Used for the meta `keywords` field. */
  keywords: readonly string[];
  /** Alt text for the hero image when one is supplied later. */
  heroImageAlt: string;
  /** Optional hero image absolute URL. */
  heroImageUrl?: string;
  /** Author display name. Defaults to "Camrynn Dilley". */
  author?: string;
}

/** Fully-loaded post: frontmatter + a server-renderable body component. */
export interface Post {
  meta: PostMeta;
  /** Server React component that renders the post body. */
  Body: () => ReactNode;
}

import { post as post1 } from '../../content/blog/the-instagram-hashtag-is-dead-heres-what-replaced-it';
import { post as post2 } from '../../content/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding';
import { post as post3 } from '../../content/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026';
import { post as post4 } from '../../content/blog/wedding-photo-wall-app-comparison-tinybooth-vs-pov-vs-kululu';
import { post as post5 } from '../../content/blog/how-to-save-money-on-your-wedding-photobooth-rent-vs-diy';
import { post as post6 } from '../../content/blog/the-ultimate-photo-strip-layout-guide-1x4-2x2-and-more';
import { post as post7 } from '../../content/blog/event-photo-retention-how-long-should-you-keep-the-photos';
import { post as post8 } from '../../content/blog/qr-code-photo-upload-how-to-set-it-up-at-your-party-in-5-minutes';

/**
 * Newest-first list. Sorted by `meta.date` descending so the index page
 * does not have to re-sort.
 */
export const ALL_POSTS: readonly Post[] = [
  post1,
  post2,
  post3,
  post4,
  post5,
  post6,
  post7,
  post8,
].sort((a, b) => b.meta.date.localeCompare(a.meta.date));

/** Return a post by its slug, or null if it does not exist. */
export function postBySlug(slug: string): Post | null {
  return ALL_POSTS.find((p) => p.meta.slug === slug) ?? null;
}

/** Return all post slugs. Used by `generateStaticParams`. */
export function allPostSlugs(): readonly string[] {
  return ALL_POSTS.map((p) => p.meta.slug);
}

/**
 * Estimate reading time in minutes for a string of body text. Uses 230
 * words per minute (the average reading speed for non-fiction).
 *
 * @param text Raw text body.
 */
export function readingTimeMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * Pick `n` posts that are not `excludeSlug`. Used for the related-posts
 * footer on each post page.
 *
 * @param excludeSlug Slug of the current post; never returned.
 * @param n How many related posts to return.
 */
export function relatedPosts(excludeSlug: string, n = 3): readonly Post[] {
  return ALL_POSTS.filter((p) => p.meta.slug !== excludeSlug).slice(0, n);
}
