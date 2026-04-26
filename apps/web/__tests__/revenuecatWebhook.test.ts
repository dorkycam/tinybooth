/**
 * Tests for the RevenueCat webhook. Mocks the prisma client at module scope.
 * Covers: signature failure paths, every event type we handle, idempotent
 * replay, and the revoke / strip-unlock outcomes.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';

interface MockEvent {
  id: string;
  ownerId: string | null;
  endsAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
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
  watermarkRemoved: boolean;
  createdAt: Date;
}

vi.mock('../src/lib/db', () => {
  const purchases = new Map<string, MockPurchase>();
  const events = new Map<string, MockEvent>();
  const strips = new Map<string, MockStrip>();
  // Helper that mirrors the @@unique([source, externalId]) lookup.
  function findByUnique(source: string, externalId: string): MockPurchase | undefined {
    for (const p of purchases.values()) {
      if (p.source === source && p.externalId === externalId) return p;
    }
    return undefined;
  }
  return {
    db: {
      purchase: {
        upsert: vi.fn(
          async ({
            where,
            create,
          }: {
            where: { source_externalId: { source: string; externalId: string } };
            create: Omit<MockPurchase, 'id' | 'createdAt'>;
          }) => {
            const existing = findByUnique(
              where.source_externalId.source,
              where.source_externalId.externalId,
            );
            if (existing) return existing;
            const id = `pu_${purchases.size + 1}`;
            const row: MockPurchase = { id, createdAt: new Date(), ...create };
            purchases.set(id, row);
            return row;
          },
        ),
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return purchases.get(where.id) ?? null;
        }),
      },
      event: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return events.get(where.id) ?? null;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<MockEvent>;
          }) => {
            const existing = events.get(where.id);
            if (!existing) throw new Error('event missing');
            const next = { ...existing, ...data };
            events.set(where.id, next);
            return next;
          },
        ),
      },
      strip: {
        findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
          const matchEventId = (where as { eventId?: string }).eventId;
          const items = Array.from(strips.values())
            .filter((s) => (matchEventId !== undefined ? s.eventId === matchEventId : true))
            .filter((s) => s.watermarkRemoved === false)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return items[0] ?? null;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: Partial<MockStrip>;
          }) => {
            const s = strips.get(where.id);
            if (!s) throw new Error('strip missing');
            const next = { ...s, ...data };
            strips.set(where.id, next);
            return next;
          },
        ),
      },
      __seedEvent(ev: MockEvent): void {
        events.set(ev.id, ev);
      },
      __seedStrip(s: MockStrip): void {
        strips.set(s.id, s);
      },
      __purchases: purchases,
      __events: events,
      __strips: strips,
      __reset(): void {
        purchases.clear();
        events.clear();
        strips.clear();
      },
    },
  };
});

import { POST } from '../app/api/webhooks/revenuecat/route';
import { db } from '../src/lib/db';

interface MockedDb {
  __seedEvent(ev: MockEvent): void;
  __seedStrip(s: MockStrip): void;
  __events: Map<string, MockEvent>;
  __purchases: Map<string, MockPurchase>;
  __strips: Map<string, MockStrip>;
  __reset(): void;
}
const mocked = db as unknown as MockedDb;

const SECRET = 'shh-test-secret';

beforeEach(() => {
  process.env.REVENUECAT_WEBHOOK_SECRET = SECRET;
  mocked.__reset();
});

interface RcEventBody {
  type: string;
  app_user_id: string;
  product_id: string;
  store: string;
  transaction_id: string;
  price_in_purchased_currency?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

function makeBearerReq(body: { event: RcEventBody }): Request {
  return new Request('http://localhost/api/webhooks/revenuecat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify(body),
  });
}

function makeSignedReq(
  body: { event: RcEventBody } | string,
  signOverride?: string,
): Request {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  const sig =
    signOverride ?? createHmac('sha256', SECRET).update(raw).digest('hex');
  return new Request('http://localhost/api/webhooks/revenuecat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-revenuecat-signature': `sha256=${sig}`,
    },
    body: raw,
  });
}

describe('signature verification', () => {
  it('returns 503 when secret env is missing', async () => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeBearerReq({ event: { type: 'INITIAL_PURCHASE' } as RcEventBody }) as any,
    );
    expect(res.status).toBe(503);
  });

  it('rejects when neither bearer nor HMAC matches', async () => {
    const req = new Request('http://localhost/api/webhooks/revenuecat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer wrong' },
      body: '{}',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('accepts a valid HMAC-SHA256 signature header', async () => {
    mocked.__seedEvent({
      id: 'ev1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
    });
    const ev: RcEventBody = {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'u1',
      product_id: 'event_pass',
      store: 'STRIPE',
      transaction_id: 'tx_hmac',
      metadata: { eventId: 'ev1' },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeSignedReq({ event: ev }) as any);
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev1')!.tier).toBe('EVENT_PASS');
  });

  it('rejects a bad HMAC signature', async () => {
    const ev: RcEventBody = {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'u1',
      product_id: 'event_pass',
      store: 'STRIPE',
      transaction_id: 'tx_bad',
    };
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeSignedReq({ event: ev }, 'deadbeef'.repeat(8)) as any,
    );
    expect(res.status).toBe(401);
  });
});

describe('body validation', () => {
  it('returns 400 on invalid JSON body', async () => {
    const req = new Request('http://localhost/api/webhooks/revenuecat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${SECRET}` },
      body: 'not-json',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing required event fields', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeBearerReq({ event: { type: 'INITIAL_PURCHASE' } as RcEventBody }) as any,
    );
    expect(res.status).toBe(400);
  });
});

describe('apply event types', () => {
  it('INITIAL_PURCHASE upgrades event tier', async () => {
    mocked.__seedEvent({
      id: 'ev1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'APP_STORE',
          transaction_id: 'tx_init',
          price_in_purchased_currency: 14.99,
          metadata: { eventId: 'ev1' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { outcome: string };
    expect(body.outcome).toBe('tier_upgraded');
    expect(mocked.__events.get('ev1')!.tier).toBe('EVENT_PASS');
  });

  it('NON_RENEWING_PURCHASE applies as well', async () => {
    mocked.__seedEvent({
      id: 'ev1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: null,
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'NON_RENEWING_PURCHASE',
          app_user_id: 'u1',
          product_id: 'event_pass_plus',
          store: 'PLAY_STORE',
          transaction_id: 'tx_nr',
          metadata: { eventId: 'ev1' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev1')!.tier).toBe('EVENT_PASS_PLUS');
  });

  it('RENEWAL applies (treated like an apply for safety)', async () => {
    mocked.__seedEvent({
      id: 'ev2',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'RENEWAL',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'STRIPE',
          transaction_id: 'tx_renew',
          metadata: { eventId: 'ev2' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev2')!.tier).toBe('EVENT_PASS');
  });

  it('PRODUCT_CHANGE applies the new tier', async () => {
    mocked.__seedEvent({
      id: 'ev3',
      ownerId: 'u1',
      tier: 'EVENT_PASS',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-08-01'),
      createdAt: new Date('2030-04-01'),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'PRODUCT_CHANGE',
          app_user_id: 'u1',
          product_id: 'event_pass_plus',
          store: 'APP_STORE',
          transaction_id: 'tx_chg',
          metadata: { eventId: 'ev3' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev3')!.tier).toBe('EVENT_PASS_PLUS');
  });

  it('strip_unlock product flips the most recent strip', async () => {
    mocked.__seedStrip({
      id: 's1',
      eventId: null,
      watermarkRemoved: false,
      createdAt: new Date(),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'NON_RENEWING_PURCHASE',
          app_user_id: 'u1',
          product_id: 'strip_unlock',
          store: 'APP_STORE',
          transaction_id: 'tx_strip',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { outcome: string };
    expect(body.outcome).toBe('strip_unlocked');
    expect(mocked.__strips.get('s1')!.watermarkRemoved).toBe(true);
  });
});

describe('revoke event types', () => {
  it('CANCELLATION drops a paid event back to FREE', async () => {
    mocked.__seedEvent({
      id: 'ev_x',
      ownerId: 'u1',
      tier: 'EVENT_PASS_PLUS',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-08-01'),
      createdAt: new Date('2030-04-01'),
    });
    // Seed the prior purchase via a first call so revoke has a row to find.
    await POST(
      makeBearerReq({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'u1',
          product_id: 'event_pass_plus',
          store: 'APP_STORE',
          transaction_id: 'tx_seed',
          metadata: { eventId: 'ev_x' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'CANCELLATION',
          app_user_id: 'u1',
          product_id: 'event_pass_plus',
          store: 'APP_STORE',
          transaction_id: 'tx_seed',
          metadata: { eventId: 'ev_x' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev_x')!.tier).toBe('FREE');
  });

  it('EXPIRATION revokes the same way', async () => {
    mocked.__seedEvent({
      id: 'ev_y',
      ownerId: 'u1',
      tier: 'EVENT_PASS',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-08-01'),
      createdAt: new Date('2030-04-01'),
    });
    await POST(
      makeBearerReq({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'STRIPE',
          transaction_id: 'tx_y',
          metadata: { eventId: 'ev_y' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'EXPIRATION',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'STRIPE',
          transaction_id: 'tx_y',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev_y')!.tier).toBe('FREE');
  });
});

describe('logging-only and ignored types', () => {
  it('BILLING_ISSUE returns ok without entitlement change', async () => {
    mocked.__seedEvent({
      id: 'ev_z',
      ownerId: 'u1',
      tier: 'EVENT_PASS',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-08-01'),
      createdAt: new Date('2030-04-01'),
    });
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'BILLING_ISSUE',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'APP_STORE',
          transaction_id: 'tx_bill',
          metadata: { eventId: 'ev_z' },
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    expect(mocked.__events.get('ev_z')!.tier).toBe('EVENT_PASS');
  });

  it('unknown event types are ignored with 200', async () => {
    const res = await POST(
      makeBearerReq({
        event: {
          type: 'TRANSFER',
          app_user_id: 'u1',
          product_id: 'event_pass',
          store: 'APP_STORE',
          transaction_id: 'tx_xfr',
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ignored?: boolean };
    expect(body.ignored).toBe(true);
  });
});

describe('idempotency', () => {
  it('replaying the same INITIAL_PURCHASE leaves only one Purchase row', async () => {
    mocked.__seedEvent({
      id: 'ev1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
    });
    const ev = {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'u1',
      product_id: 'event_pass',
      store: 'APP_STORE',
      transaction_id: 'tx_dup',
      metadata: { eventId: 'ev1' },
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r1 = await POST(makeBearerReq({ event: ev }) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = await POST(makeBearerReq({ event: ev }) as any);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(mocked.__purchases.size).toBe(1);
    expect(mocked.__events.get('ev1')!.tier).toBe('EVENT_PASS');
  });
});
