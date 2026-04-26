/**
 * Unit tests for the `post` tRPC router.
 */
import { describe, expect, it, vi } from 'vitest';
import { postRouter, sanitizeCaption } from '../src/server/api/routers/post';

interface MockEvent {
  id: string;
  retainUntil: Date;
  tier?: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  endsAt?: Date | null;
  createdAt?: Date;
  emailDeliveries?: number;
  smsDeliveries?: number;
}

interface MockPost {
  id: string;
  eventId: string;
  caption: string | null;
  approved: boolean;
  createdAt: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  photos: any[];
  uploaderToken: string | null;
}

function makeDb(initial: { events?: MockEvent[]; posts?: MockPost[] } = {}): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any;
  posts: Map<string, MockPost>;
} {
  const events = new Map<string, MockEvent>();
  const posts = new Map<string, MockPost>();
  for (const e of initial.events ?? []) {
    events.set(e.id, {
      tier: 'FREE',
      endsAt: null,
      createdAt: new Date(),
      emailDeliveries: 0,
      smsDeliveries: 0,
      ...e,
    });
  }
  for (const p of initial.posts ?? []) posts.set(p.id, p);

  const proxy = {
    event: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return events.get(where.id) ?? null;
      }),
    },
    post: {
      count: vi.fn(async ({ where }: { where: { eventId: string } }) => {
        let c = 0;
        for (const p of posts.values()) if (p.eventId === where.eventId) c += 1;
        return c;
      }),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            eventId: string;
            caption: string | null;
            uploaderToken: string | null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            photos: { create: any[] };
          };
        }) => {
          const id = `p_${posts.size + 1}`;
          const next: MockPost = {
            id,
            eventId: data.eventId,
            caption: data.caption,
            uploaderToken: data.uploaderToken,
            approved: true,
            createdAt: new Date(),
            photos: data.photos.create.map((p, i) => ({ ...p, id: `ph_${id}_${i}` })),
          };
          posts.set(id, next);
          return next;
        },
      ),
      findMany: vi.fn(
        async ({
          where,
          take,
        }: {
          where: { eventId: string; approved: boolean; createdAt?: { gt: Date } };
          take: number;
        }) => {
          const all = Array.from(posts.values()).filter(
            (p) =>
              p.eventId === where.eventId &&
              (!where.createdAt || p.createdAt.getTime() > where.createdAt.gt.getTime()),
          );
          all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return all.slice(0, take);
        },
      ),
    },
  };
  return { proxy, posts };
}

describe('post router', () => {
  it('create rejects for missing event', async () => {
    const { proxy } = makeDb();
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.create({
        eventId: 'missing',
        photos: [
          {
            url: 'https://example.com/a.webp',
            storageKey: 'k',
            mediaType: 'image',
            width: 100,
            height: 100,
            order: 0,
          },
        ],
      }),
    ).rejects.toThrow();
  });

  it('create rejects when event has expired', async () => {
    const { proxy } = makeDb({
      events: [{ id: 'e1', retainUntil: new Date(Date.now() - 1000) }],
    });
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.create({
        eventId: 'e1',
        photos: [
          { url: 'https://x/a.webp', storageKey: 'k', mediaType: 'image', width: 1, height: 1, order: 0 },
        ],
      }),
    ).rejects.toThrow();
  });

  it('create succeeds and sanitizes caption', async () => {
    const { proxy } = makeDb({
      events: [{ id: 'e1', retainUntil: new Date(Date.now() + 60_000) }],
    });
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    const created = await caller.create({
      eventId: 'e1',
      caption: '<b>Hello world</b> visit https://spam.example.com now',
      photos: [
        {
          url: 'https://x/a.webp',
          storageKey: 'k',
          mediaType: 'image',
          width: 1,
          height: 1,
          order: 0,
        },
      ],
    });
    expect(created.caption).not.toContain('<b>');
    expect(created.caption).not.toContain('https://');
  });

  it('list returns posts newest first capped by limit', async () => {
    const now = Date.now();
    const { proxy } = makeDb({
      events: [{ id: 'e1', retainUntil: new Date(now + 60_000) }],
      posts: [
        {
          id: 'old',
          eventId: 'e1',
          caption: null,
          approved: true,
          createdAt: new Date(now - 10_000),
          photos: [],
          uploaderToken: null,
        },
        {
          id: 'new',
          eventId: 'e1',
          caption: null,
          approved: true,
          createdAt: new Date(now),
          photos: [],
          uploaderToken: null,
        },
      ],
    });
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    const list = await caller.list({ eventId: 'e1', limit: 1 });
    expect(list).toHaveLength(1);
    expect(list[0]!.id).toBe('new');
  });

  it('caption trimming and length cap is enforced', () => {
    expect(sanitizeCaption('   ')).toBeNull();
    const long = 'x'.repeat(200);
    expect((sanitizeCaption(long) ?? '').length).toBe(100);
  });

  it('create rejects when free-tier guest cap (100) has been reached', async () => {
    const now = Date.now();
    const seedPosts: MockPost[] = [];
    for (let i = 0; i < 100; i += 1) {
      seedPosts.push({
        id: `seed_${i}`,
        eventId: 'e1',
        caption: null,
        approved: true,
        createdAt: new Date(now - i * 1000),
        photos: [],
        uploaderToken: null,
      });
    }
    const { proxy } = makeDb({
      events: [{ id: 'e1', retainUntil: new Date(now + 60_000), tier: 'FREE' }],
      posts: seedPosts,
    });
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    await expect(
      caller.create({
        eventId: 'e1',
        photos: [
          {
            url: 'https://x/a.webp',
            storageKey: 'k',
            mediaType: 'image',
            width: 1,
            height: 1,
            order: 0,
          },
        ],
      }),
    ).rejects.toThrow(/Guest upload cap/);
  });

  it('create allows uploads on EVENT_PASS_PLUS even past free cap', async () => {
    const now = Date.now();
    const seedPosts: MockPost[] = [];
    for (let i = 0; i < 200; i += 1) {
      seedPosts.push({
        id: `seed_${i}`,
        eventId: 'e1',
        caption: null,
        approved: true,
        createdAt: new Date(now - i * 1000),
        photos: [],
        uploaderToken: null,
      });
    }
    const { proxy } = makeDb({
      events: [{ id: 'e1', retainUntil: new Date(now + 60_000), tier: 'EVENT_PASS_PLUS' }],
      posts: seedPosts,
    });
    const caller = postRouter.createCaller({ db: proxy, userId: null });
    const created = await caller.create({
      eventId: 'e1',
      photos: [
        {
          url: 'https://x/a.webp',
          storageKey: 'k',
          mediaType: 'image',
          width: 1,
          height: 1,
          order: 0,
        },
      ],
    });
    expect(created.id).toBeTruthy();
  });
});
