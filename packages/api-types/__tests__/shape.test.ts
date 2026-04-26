import { describe, expect, it } from 'vitest';
import * as types from '../src/index';
import { EventTier } from '../src/event';

describe('api-types barrel', () => {
  it('exports the EventTier enum with the expected values', () => {
    expect(EventTier.FREE).toBe('FREE');
    expect(EventTier.EVENT_PASS).toBe('EVENT_PASS');
    expect(EventTier.EVENT_PASS_PLUS).toBe('EVENT_PASS_PLUS');
  });

  it('exposes EventTier from the barrel', () => {
    expect(types.EventTier).toBe(EventTier);
  });

  it('Event interface compiles with the expected shape', () => {
    const event: types.Event = {
      id: 'evt_1',
      ownerId: null,
      name: 'Sample',
      slug: 'sample',
      tier: types.EventTier.FREE,
      startsAt: null,
      endsAt: null,
      retainUntil: new Date().toISOString(),
      branding: {},
      settings: {},
      emailDeliveries: 0,
      smsDeliveries: 0,
      createdAt: new Date().toISOString(),
    };
    expect(event.tier).toBe('FREE');
  });

  it('Post interface compiles', () => {
    const post: types.Post = {
      id: 'post_1',
      eventId: 'evt_1',
      caption: null,
      uploaderToken: null,
      approved: true,
      createdAt: new Date().toISOString(),
    };
    expect(post.approved).toBe(true);
  });

  it('Photo interface compiles with image media type', () => {
    const photo: types.Photo = {
      id: 'photo_1',
      postId: 'post_1',
      stripId: null,
      url: 'https://example.com/x.webp',
      storageKey: 'events/evt_1/posts/post_1/photo_1.webp',
      mediaType: 'image',
      width: 2048,
      height: 1536,
      order: 0,
      createdAt: new Date().toISOString(),
    };
    expect(photo.mediaType).toBe('image');
  });

  it('Strip interface compiles', () => {
    const strip: types.Strip = {
      id: 'strip_1',
      eventId: null,
      layout: '1x4_classic',
      watermarkRemoved: false,
      igShareUrl: null,
      createdAt: new Date().toISOString(),
    };
    expect(strip.layout).toBe('1x4_classic');
  });

  it('User interface compiles', () => {
    const user: types.User = {
      id: 'usr_1',
      email: 'host@example.com',
      displayName: null,
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };
    expect(user.email).toContain('@');
  });
});
