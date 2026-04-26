/**
 * Tests for the blog post registry and the helpers in src/lib/blog.
 */
import { describe, expect, it } from 'vitest';
import {
  ALL_POSTS,
  allPostSlugs,
  postBySlug,
  readingTimeMinutes,
  relatedPosts,
} from '../src/lib/blog';

describe('ALL_POSTS', () => {
  it('exposes the eight cornerstone posts', () => {
    expect(ALL_POSTS).toHaveLength(8);
  });

  it('is sorted newest-first', () => {
    for (let i = 1; i < ALL_POSTS.length; i += 1) {
      const prev = ALL_POSTS[i - 1];
      const cur = ALL_POSTS[i];
      if (!prev || !cur) continue;
      expect(prev.meta.date.localeCompare(cur.meta.date)).toBeGreaterThanOrEqual(0);
    }
  });

  it('every post has a unique slug that matches the route shape', () => {
    const slugs = new Set<string>();
    for (const post of ALL_POSTS) {
      expect(slugs.has(post.meta.slug)).toBe(false);
      slugs.add(post.meta.slug);
      expect(post.meta.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('every post has a non-empty title and description', () => {
    for (const post of ALL_POSTS) {
      expect(post.meta.title.length).toBeGreaterThan(0);
      expect(post.meta.description.length).toBeGreaterThan(50);
    }
  });

  it('every post has at least one keyword and a hero alt', () => {
    for (const post of ALL_POSTS) {
      expect(post.meta.keywords.length).toBeGreaterThan(0);
      expect(post.meta.heroImageAlt.length).toBeGreaterThan(0);
    }
  });
});

describe('postBySlug', () => {
  it('returns a post when the slug matches', () => {
    const slug = ALL_POSTS[0]?.meta.slug ?? '';
    expect(postBySlug(slug)?.meta.slug).toBe(slug);
  });
  it('returns null for an unknown slug', () => {
    expect(postBySlug('not-a-real-slug')).toBeNull();
  });
});

describe('allPostSlugs', () => {
  it('returns one slug per post', () => {
    expect(allPostSlugs()).toHaveLength(ALL_POSTS.length);
  });
});

describe('readingTimeMinutes', () => {
  it('returns at least 1 minute for short text', () => {
    expect(readingTimeMinutes('hi there')).toBe(1);
  });
  it('rounds based on a 230 wpm rate', () => {
    const text = Array.from({ length: 690 }, () => 'word').join(' ');
    expect(readingTimeMinutes(text)).toBe(3);
  });
});

describe('relatedPosts', () => {
  it('excludes the current slug', () => {
    const slug = ALL_POSTS[0]?.meta.slug ?? '';
    const related = relatedPosts(slug, 3);
    expect(related.find((r) => r.meta.slug === slug)).toBeUndefined();
    expect(related).toHaveLength(3);
  });

  it('returns at most n posts', () => {
    expect(relatedPosts('any', 1)).toHaveLength(1);
  });
});
