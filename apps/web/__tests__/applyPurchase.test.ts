/**
 * Tests for applyPurchase + revokePurchase. Uses a hand-rolled in-memory DB
 * mock that satisfies the loose ApplyPurchaseDb shape.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  applyPurchase,
  revokePurchase,
  type ApplyPurchaseDb,
} from '../src/server/jobs/applyPurchase';

interface MockEvent {
  id: string;
  ownerId: string | null;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  endsAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
}
interface MockPurchase {
  id: string;
  userId: string;
  eventId: string | null;
  product: string;
  source: string;
  externalId: string;
  createdAt: Date;
}
interface MockStrip {
  id: string;
  eventId: string | null;
  userId: string | null;
  watermarkRemoved: boolean;
  createdAt: Date;
}

function makeDb(seed: {
  events?: MockEvent[];
  purchases?: MockPurchase[];
  strips?: MockStrip[];
}): { db: ApplyPurchaseDb; events: Map<string, MockEvent>; strips: Map<string, MockStrip> } {
  const events = new Map<string, MockEvent>();
  const purchases = new Map<string, MockPurchase>();
  const strips = new Map<string, MockStrip>();
  for (const e of seed.events ?? []) events.set(e.id, e);
  for (const p of seed.purchases ?? []) purchases.set(p.id, p);
  for (const s of seed.strips ?? []) strips.set(s.id, s);
  const db: ApplyPurchaseDb = {
    purchase: {
      findUnique: vi.fn(async ({ where }) => purchases.get(where.id) ?? null),
    },
    event: {
      findUnique: vi.fn(async ({ where }) => events.get(where.id) ?? null),
      update: vi.fn(async ({ where, data }) => {
        const e = events.get(where.id);
        if (!e) throw new Error('not found');
        const next = { ...e, ...(data as Partial<MockEvent>) };
        events.set(where.id, next);
        return next;
      }),
    },
    strip: {
      findFirst: vi.fn(async ({ where }) => {
        const matchEventId = (where as { eventId?: string }).eventId;
        const matchUnremoved = (where as { watermarkRemoved?: boolean }).watermarkRemoved;
        const items = Array.from(strips.values())
          .filter((s) => (matchEventId !== undefined ? s.eventId === matchEventId : true))
          .filter((s) =>
            matchUnremoved !== undefined ? s.watermarkRemoved === matchUnremoved : true,
          )
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return items[0] ?? null;
      }),
      update: vi.fn(async ({ where, data }) => {
        const s = strips.get(where.id);
        if (!s) throw new Error('not found');
        const next = { ...s, ...(data as Partial<MockStrip>) };
        strips.set(where.id, next);
        return next;
      }),
    },
  };
  return { db, events, strips };
}

const NOW = new Date('2030-04-01T12:00:00Z');

describe('applyPurchase: Event Pass', () => {
  it('upgrades a FREE event to EVENT_PASS and extends retainUntil 60 days past endsAt', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: new Date('2030-05-01T00:00:00Z'),
      retainUntil: new Date('2030-04-08T00:00:00Z'),
      createdAt: new Date('2030-04-01T00:00:00Z'),
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'cs_1',
      createdAt: new Date(),
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('tier_upgraded');
    expect(r.eventId).toBe('e1');
    const updated = events.get('e1')!;
    expect(updated.tier).toBe('EVENT_PASS');
    const days = (updated.retainUntil.getTime() - ev.endsAt!.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(60, 5);
  });

  it('defaults endsAt to now + 24 hours when the event has no endsAt', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: null,
      retainUntil: new Date('2030-04-08T00:00:00Z'),
      createdAt: NOW,
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    await applyPurchase(db, 'p1', NOW);
    const updated = events.get('e1')!;
    const endsHrs = (updated.endsAt!.getTime() - NOW.getTime()) / (60 * 60 * 1000);
    expect(endsHrs).toBeCloseTo(24, 5);
  });

  it('is a no-op when the event tier is already at-or-above the requested level', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'EVENT_PASS_PLUS',
      endsAt: new Date('2030-05-01T00:00:00Z'),
      retainUntil: new Date('2030-08-01T00:00:00Z'),
      createdAt: new Date('2030-04-01T00:00:00Z'),
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'cs_1',
      createdAt: new Date(),
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
    expect(events.get('e1')!.tier).toBe('EVENT_PASS_PLUS');
  });
});

describe('applyPurchase: Event Pass Plus', () => {
  it('upgrades EVENT_PASS to EVENT_PASS_PLUS with 90-day retention', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'EVENT_PASS',
      endsAt: new Date('2030-05-01T00:00:00Z'),
      retainUntil: new Date('2030-06-30T00:00:00Z'),
      createdAt: new Date('2030-04-01T00:00:00Z'),
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass_plus',
      source: 'web_stripe',
      externalId: 'cs_2',
      createdAt: new Date(),
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('tier_upgraded');
    expect(events.get('e1')!.tier).toBe('EVENT_PASS_PLUS');
    const days =
      (events.get('e1')!.retainUntil.getTime() - ev.endsAt!.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(90, 5);
  });
});

describe('applyPurchase: Strip Unlock', () => {
  it('flips watermarkRemoved on the most recent strip when an eventId is set', async () => {
    const strips: MockStrip[] = [
      {
        id: 's_old',
        eventId: 'e1',
        userId: 'u1',
        watermarkRemoved: false,
        createdAt: new Date('2030-03-01T00:00:00Z'),
      },
      {
        id: 's_new',
        eventId: 'e1',
        userId: 'u1',
        watermarkRemoved: false,
        createdAt: new Date('2030-04-01T00:00:00Z'),
      },
    ];
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'strip_unlock',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db, strips: store } = makeDb({ purchases: [pu], strips });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('strip_unlocked');
    expect(r.stripId).toBe('s_new');
    expect(store.get('s_new')!.watermarkRemoved).toBe(true);
    expect(store.get('s_old')!.watermarkRemoved).toBe(false);
  });

  it('falls back to the most recent strip across all events when no eventId is set', async () => {
    const strips: MockStrip[] = [
      {
        id: 's_standalone',
        eventId: null,
        userId: 'u1',
        watermarkRemoved: false,
        createdAt: NOW,
      },
    ];
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: null,
      product: 'strip_unlock',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db, strips: store } = makeDb({ purchases: [pu], strips });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('strip_unlocked');
    expect(store.get('s_standalone')!.watermarkRemoved).toBe(true);
  });

  it('is a no-op when no eligible strip exists', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: null,
      product: 'strip_unlock',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });
});

describe('applyPurchase: edge cases', () => {
  it('returns noop when purchase id does not exist', async () => {
    const { db } = makeDb({});
    const r = await applyPurchase(db, 'missing', NOW);
    expect(r.outcome).toBe('noop');
  });

  it('returns unknown_product for products outside the catalog', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'mystery',
      source: 'web_stripe',
      externalId: 'x',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('unknown_product');
  });

  it('returns noop for paid purchase missing eventId', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: null,
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'x',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });

  it('returns noop for paid purchase whose event has been deleted', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'gone',
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'x',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await applyPurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });
});

describe('revokePurchase', () => {
  it('reverts a paid event to FREE and shortens retainUntil to createdAt + 7 days', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'EVENT_PASS_PLUS',
      endsAt: new Date('2030-05-01T00:00:00Z'),
      retainUntil: new Date('2030-08-01T00:00:00Z'),
      createdAt: new Date('2030-04-01T00:00:00Z'),
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass_plus',
      source: 'web_stripe',
      externalId: 'cs_3',
      createdAt: new Date(),
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    const r = await revokePurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('tier_upgraded');
    expect(events.get('e1')!.tier).toBe('FREE');
    const expected = new Date(ev.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    expect(events.get('e1')!.retainUntil.getTime()).toBe(expected.getTime());
  });

  it('floors retainUntil at now + 24 hours so photos are not yanked mid-event', async () => {
    const ev: MockEvent = {
      id: 'e1',
      ownerId: 'u1',
      tier: 'EVENT_PASS',
      endsAt: NOW,
      retainUntil: new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000),
      // createdAt is 30 days ago; createdAt + 7 days is in the past, so the
      // floor (now + 24h) should win.
      createdAt: new Date(NOW.getTime() - 30 * 24 * 60 * 60 * 1000),
    };
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'e1',
      product: 'event_pass',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db, events } = makeDb({ events: [ev], purchases: [pu] });
    await revokePurchase(db, 'p1', NOW);
    const hrs = (events.get('e1')!.retainUntil.getTime() - NOW.getTime()) / (60 * 60 * 1000);
    expect(hrs).toBeCloseTo(24, 1);
  });

  it('is a no-op for Strip Unlock purchases', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: null,
      product: 'strip_unlock',
      source: 'ios_iap',
      externalId: 't_1',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await revokePurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });

  it('is a no-op when the purchase is missing', async () => {
    const { db } = makeDb({});
    const r = await revokePurchase(db, 'gone', NOW);
    expect(r.outcome).toBe('noop');
  });

  it('is a no-op when the event has been deleted', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: 'gone',
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'cs',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await revokePurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });

  it('is a no-op when a paid purchase has no eventId', async () => {
    const pu: MockPurchase = {
      id: 'p1',
      userId: 'u1',
      eventId: null,
      product: 'event_pass',
      source: 'web_stripe',
      externalId: 'cs',
      createdAt: NOW,
    };
    const { db } = makeDb({ purchases: [pu] });
    const r = await revokePurchase(db, 'p1', NOW);
    expect(r.outcome).toBe('noop');
  });
});
