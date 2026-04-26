/**
 * Unit tests for the `event` tRPC router. Uses a hand-rolled Prisma mock so we
 * don't need a real database connection in CI.
 */
import { describe, expect, it, vi } from 'vitest';
import { eventRouter, mapProductToTier, computeRetainUntil } from '../src/server/api/routers/event';

interface MockEvent {
  id: string;
  ownerId: string | null;
  name: string;
  slug: string;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  retainUntil: Date;
  endsAt: Date | null;
  branding: Record<string, unknown>;
  settings: Record<string, unknown>;
  createdAt: Date;
  claimToken?: string | null;
  claimedAt?: Date | null;
}

interface MockPurchase {
  id: string;
  product: string;
  eventId?: string | null;
  userId?: string;
  source?: string;
  externalId?: string;
  createdAt?: Date;
}

function makeDb(initial: { events?: MockEvent[]; purchases?: MockPurchase[] } = {}): {
  events: Map<string, MockEvent>;
  purchases: Map<string, MockPurchase>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any;
} {
  const events = new Map<string, MockEvent>();
  const purchases = new Map<string, MockPurchase>();
  for (const e of initial.events ?? []) events.set(e.id, e);
  for (const p of initial.purchases ?? []) purchases.set(p.id, p);

  const proxy = {
    event: {
      create: vi.fn(async ({ data }: { data: Partial<MockEvent> }) => {
        const id = `ev_${events.size + 1}`;
        const ev: MockEvent = {
          id,
          ownerId: data.ownerId ?? null,
          name: data.name ?? '',
          slug: data.slug ?? '',
          tier: (data.tier as MockEvent['tier']) ?? 'FREE',
          retainUntil: (data.retainUntil as Date) ?? new Date(),
          endsAt: data.endsAt ?? null,
          branding: (data.branding as Record<string, unknown>) ?? {},
          settings: (data.settings as Record<string, unknown>) ?? {},
          createdAt: new Date(),
          claimToken: data.claimToken ?? null,
          claimedAt: data.claimedAt ?? null,
        };
        events.set(id, ev);
        return ev;
      }),
      findUnique: vi.fn(async ({ where }: { where: { id?: string; slug?: string } }) => {
        if (where.id) return events.get(where.id) ?? null;
        if (where.slug) {
          for (const e of events.values()) if (e.slug === where.slug) return e;
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<MockEvent> }) => {
        const e = events.get(where.id);
        if (!e) throw new Error('not found');
        const next = { ...e, ...data };
        events.set(where.id, next);
        return next;
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        events.delete(where.id);
        return { id: where.id };
      }),
    },
    purchase: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return purchases.get(where.id) ?? null;
      }),
    },
    strip: {
      findFirst: vi.fn(async () => null),
      update: vi.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
    },
  };
  return { events, purchases, proxy };
}

describe('event router', () => {
  it('create assigns slug + FREE tier + 7-day retainUntil', async () => {
    const { proxy } = makeDb();
    const caller = eventRouter.createCaller({ db: proxy, userId: null });
    const ev = await caller.create({ name: 'Test event' });
    expect(ev.tier).toBe('FREE');
    expect(ev.slug).toMatch(/^test-event-/);
    expect(ev.ownerId).toBeNull();
    const days = (ev.retainUntil.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThan(7.1);
  });

  it('create rejects empty cleaned name', async () => {
    const { proxy } = makeDb();
    const caller = eventRouter.createCaller({ db: proxy, userId: null });
    await expect(caller.create({ name: '   ' })).rejects.toThrow();
  });

  it('bySlug returns event when found, throws NOT_FOUND otherwise', async () => {
    const { proxy } = makeDb({
      events: [
        {
          id: 'a',
          ownerId: null,
          name: 'X',
          slug: 'x',
          tier: 'FREE',
          retainUntil: new Date(Date.now() + 1000),
          endsAt: null,
          branding: {},
          settings: {},
          createdAt: new Date(),
        },
      ],
    });
    const caller = eventRouter.createCaller({ db: proxy, userId: null });
    const ev = await caller.bySlug({ slug: 'x' });
    expect(ev.id).toBe('a');
    await expect(caller.bySlug({ slug: 'missing' })).rejects.toThrow();
  });

  it('update enforces owner match', async () => {
    const { proxy } = makeDb({
      events: [
        {
          id: 'a',
          ownerId: 'owner1',
          name: 'X',
          slug: 'x',
          tier: 'FREE',
          retainUntil: new Date(Date.now() + 1000),
          endsAt: null,
          branding: {},
          settings: {},
          createdAt: new Date(),
        },
      ],
    });
    const caller = eventRouter.createCaller({ db: proxy, userId: 'someone-else' });
    await expect(caller.update({ id: 'a', name: 'Renamed' })).rejects.toThrow();
  });

  it('applyPurchase bumps tier on event_pass', async () => {
    const ev: MockEvent = {
      id: 'a',
      ownerId: 'owner1',
      name: 'X',
      slug: 'x',
      tier: 'FREE',
      retainUntil: new Date(),
      endsAt: new Date('2030-01-01T00:00:00Z'),
      branding: {},
      settings: {},
      createdAt: new Date(),
    };
    const { proxy } = makeDb({
      events: [ev],
      purchases: [
        { id: 'p1', product: 'event_pass', eventId: 'a', userId: 'owner1', source: 'web_stripe', externalId: 'cs_x', createdAt: new Date() },
      ],
    });
    const caller = eventRouter.createCaller({ db: proxy, userId: 'owner1' });
    const updated = await caller.applyPurchase({ eventId: 'a', purchaseId: 'p1' });
    expect(updated.tier).toBe('EVENT_PASS');
    expect(updated.retainUntil.getTime()).toBeGreaterThan(ev.endsAt!.getTime());
  });

  it('delete enforces owner match', async () => {
    const { proxy } = makeDb({
      events: [
        {
          id: 'a',
          ownerId: 'owner1',
          name: 'X',
          slug: 'x',
          tier: 'FREE',
          retainUntil: new Date(),
          endsAt: null,
          branding: {},
          settings: {},
          createdAt: new Date(),
        },
      ],
    });
    const intruder = eventRouter.createCaller({ db: proxy, userId: 'other' });
    await expect(intruder.delete({ id: 'a' })).rejects.toThrow();
    const owner = eventRouter.createCaller({ db: proxy, userId: 'owner1' });
    const result = await owner.delete({ id: 'a' });
    expect(result.ok).toBe(true);
  });
});

describe('event helpers', () => {
  it('mapProductToTier maps known products', () => {
    expect(mapProductToTier('event_pass')).toBe('EVENT_PASS');
    expect(mapProductToTier('event_pass_plus')).toBe('EVENT_PASS_PLUS');
    expect(mapProductToTier('strip_unlock')).toBeNull();
    expect(mapProductToTier('mystery')).toBeNull();
  });

  it('computeRetainUntil yields 60d/90d windows from endsAt', () => {
    const ends = new Date('2030-06-01T00:00:00Z');
    const pass = computeRetainUntil('EVENT_PASS', ends);
    const passPlus = computeRetainUntil('EVENT_PASS_PLUS', ends);
    const passDays = (pass.getTime() - ends.getTime()) / (24 * 60 * 60 * 1000);
    const plusDays = (passPlus.getTime() - ends.getTime()) / (24 * 60 * 60 * 1000);
    expect(passDays).toBeCloseTo(60, 5);
    expect(plusDays).toBeCloseTo(90, 5);
  });
});

describe('event.claim', () => {
  function makeClaimable(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proxy: any;
    event: MockEvent & { claimToken: string | null; claimedAt: Date | null };
  } {
    const event = {
      id: 'a',
      ownerId: null,
      name: 'Mya 30',
      slug: 'mya-30-x',
      tier: 'FREE' as const,
      retainUntil: new Date(Date.now() + 1000),
      endsAt: null,
      branding: {},
      settings: {},
      createdAt: new Date(),
      claimToken: 'TOKEN_VALUE',
      claimedAt: null,
    };
    const proxy = {
      event: {
        findUnique: vi.fn(async () => event),
        update: vi.fn(async ({ data }: { data: Partial<typeof event> }) => {
          Object.assign(event, data);
          return event;
        }),
      },
    };
    return { proxy, event };
  }

  it('rejects when claim token does not match', async () => {
    const { proxy } = makeClaimable();
    const caller = eventRouter.createCaller({ db: proxy, userId: 'me' });
    await expect(
      caller.claim({ eventId: 'a', claimToken: 'WRONG' }),
    ).rejects.toThrow();
  });

  it('rejects when the event is already owned', async () => {
    const { proxy, event } = makeClaimable();
    event.ownerId = 'someone-else';
    const caller = eventRouter.createCaller({ db: proxy, userId: 'me' });
    await expect(
      caller.claim({ eventId: 'a', claimToken: 'TOKEN_VALUE' }),
    ).rejects.toThrow();
  });

  it('sets ownerId, clears claim token, sets claimedAt on success', async () => {
    const { proxy, event } = makeClaimable();
    const caller = eventRouter.createCaller({ db: proxy, userId: 'me' });
    const updated = await caller.claim({ eventId: 'a', claimToken: 'TOKEN_VALUE' });
    expect(updated.ownerId).toBe('me');
    expect(event.claimToken).toBeNull();
    expect(event.claimedAt).toBeInstanceOf(Date);
  });

  it('create returns a claim token for anon callers and null for authed', async () => {
    const { proxy } = makeDb();
    const anon = eventRouter.createCaller({ db: proxy, userId: null });
    const a = await anon.create({ name: 'Anon party' });
    expect(typeof a.claimToken === 'string' && a.claimToken.length > 0).toBe(true);

    const authed = eventRouter.createCaller({ db: proxy, userId: 'owner1' });
    const b = await authed.create({ name: 'Owner party' });
    expect(b.claimToken).toBeNull();
  });
});
