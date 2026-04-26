/**
 * Pure-function tests for the migration transforms. Avoids any I/O so this
 * runs in offline CI.
 */
import { describe, expect, it } from 'vitest';
import { transformEvent, transformPost, transformPhoto } from './migrate-tinywall';

describe('migrate-tinywall transforms', () => {
  it('event grandfathers retainUntil to 365 days from createdAt', () => {
    const out = transformEvent({
      id: 'e1',
      name: 'X',
      slug: 'x-1234',
      dateCreated: '2026-03-16 20:25:02.795',
      settings: '{}',
    });
    expect(out.tier).toBe('FREE');
    expect(out.ownerId).toBeNull();
    const created = new Date(out.createdAt).getTime();
    const retain = new Date(out.retainUntil).getTime();
    const days = (retain - created) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(365, 5);
  });

  it('event tolerates malformed settings JSON', () => {
    const out = transformEvent({
      id: 'e1',
      name: 'X',
      slug: 'x-1234',
      dateCreated: '2026-03-16 20:25:02.795',
      settings: 'not-json',
    });
    expect(out.settings).toEqual({});
  });

  it('post nulls empty caption', () => {
    const out = transformPost({
      id: 'p1',
      eventId: 'e1',
      caption: '',
      dateCreated: '2026-03-16 20:25:02.795',
    });
    expect(out.caption).toBeNull();
    expect(out.approved).toBe(true);
  });

  it('photo derives storageKey from URL pathname', () => {
    const out = transformPhoto(
      {
        id: 'ph1',
        postId: 'p1',
        url: 'https://abc.public.blob.vercel-storage.com/myslug/123-abc.webp',
        order: '0',
        dateCreated: '2026-03-16 20:25:02.795',
        height: '1024',
        width: '1024',
        mediaType: 'image',
      },
      'myslug',
    );
    expect(out.storageKey).toBe('myslug/123-abc.webp');
    expect(out.width).toBe(1024);
    expect(out.height).toBe(1024);
  });

  it('photo falls back to synthetic key on malformed URL', () => {
    const out = transformPhoto(
      {
        id: 'ph1',
        postId: 'p1',
        url: 'not a url',
        order: '0',
        dateCreated: '2026-03-16 20:25:02.795',
        height: '1024',
        width: '1024',
        mediaType: 'image',
      },
      'eventslug',
    );
    expect(out.storageKey).toBe('events/eventslug/legacy/ph1.webp');
  });
});
