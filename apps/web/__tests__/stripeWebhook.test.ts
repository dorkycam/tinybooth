/**
 * Tests for POST /api/webhooks/stripe. Mocks the prisma client and exercises
 * the signature path, the fulfillment path, and idempotent replay.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';
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

vi.mock('../src/lib/db', () => {
  const purchases = new Map<string, MockPurchase>();
  const events = new Map<string, MockEvent>();
  function findUnique(source: string, externalId: string): MockPurchase | undefined {
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
            const existing = findUnique(
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
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => purchases.get(where.id) ?? null),
      },
      event: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => events.get(where.id) ?? null),
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
        findFirst: vi.fn(async () => null),
        update: vi.fn(),
      },
      __seedEvent(ev: MockEvent): void {
        events.set(ev.id, ev);
      },
      __purchases: purchases,
      __events: events,
      __reset(): void {
        purchases.clear();
        events.clear();
      },
    },
  };
});

import { POST } from '../app/api/webhooks/stripe/route';
import { db } from '../src/lib/db';

interface MockedDb {
  __seedEvent(ev: MockEvent): void;
  __reset(): void;
  __purchases: Map<string, MockPurchase>;
  __events: Map<string, MockEvent>;
}
const mocked = db as unknown as MockedDb;

beforeEach(() => {
  mocked.__reset();
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

interface CheckoutSessionShape {
  id: string;
  amount_total: number;
  currency: string;
  metadata: Record<string, string>;
  customer_email: string | null;
  payment_status: string;
}

function makeBody(session: CheckoutSessionShape, type = 'checkout.session.completed'): string {
  return JSON.stringify({ id: 'evt_1', type, data: { object: session } });
}

function makeReq(body: string, opts: { sign?: boolean } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.sign) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? 'whsec_x';
    const t = '1700000000';
    const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
    headers['stripe-signature'] = `t=${t},v1=${v1}`;
  }
  return new Request('https://x/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body,
  });
}

describe('POST /api/webhooks/stripe', () => {
  it('rejects with 401 on bad signature when secret is set', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    const req = new Request('https://x/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=baddead' },
      body: '{}',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('ignores unrelated event types', async () => {
    const body = makeBody(
      {
        id: 'cs_x',
        amount_total: 1299,
        currency: 'usd',
        metadata: {},
        customer_email: null,
        payment_status: 'paid',
      },
      'payment_intent.succeeded',
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body) as any);
    expect(res.status).toBe(200);
    const out = (await res.json()) as { ignored?: boolean };
    expect(out.ignored).toBe(true);
  });

  it('rejects sessions with missing metadata', async () => {
    const body = makeBody({
      id: 'cs_y',
      amount_total: 1299,
      currency: 'usd',
      metadata: { eventId: 'e1' },
      customer_email: null,
      payment_status: 'paid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body) as any);
    expect(res.status).toBe(400);
  });

  it('rejects unknown products', async () => {
    const body = makeBody({
      id: 'cs_z',
      amount_total: 1299,
      currency: 'usd',
      metadata: { eventId: 'e1', productId: 'mystery', userId: 'u1' },
      customer_email: null,
      payment_status: 'paid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body) as any);
    expect(res.status).toBe(400);
  });

  it('ignores unpaid sessions', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'u1',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
      tier: 'FREE',
    });
    const body = makeBody({
      id: 'cs_unpaid',
      amount_total: 1299,
      currency: 'usd',
      metadata: { eventId: 'e1', productId: 'event_pass', userId: 'u1' },
      customer_email: null,
      payment_status: 'unpaid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body) as any);
    expect(res.status).toBe(200);
    const out = (await res.json()) as { ignored?: boolean };
    expect(out.ignored).toBe(true);
  });

  it('fulfills a paid Event Pass and bumps the tier', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'u1',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
      tier: 'FREE',
    });
    const body = makeBody({
      id: 'cs_paid',
      amount_total: 1299,
      currency: 'usd',
      metadata: { eventId: 'e1', productId: 'event_pass', userId: 'u1' },
      customer_email: 'host@example.com',
      payment_status: 'paid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body) as any);
    expect(res.status).toBe(200);
    expect(mocked.__events.get('e1')!.tier).toBe('EVENT_PASS');
  });

  it('idempotent replay: second call returns 200 with no second Purchase row', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'u1',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
      tier: 'FREE',
    });
    const body = makeBody({
      id: 'cs_dup',
      amount_total: 1299,
      currency: 'usd',
      metadata: { eventId: 'e1', productId: 'event_pass', userId: 'u1' },
      customer_email: null,
      payment_status: 'paid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await POST(makeReq(body) as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res2 = await POST(makeReq(body) as any);
    expect(res2.status).toBe(200);
    expect(mocked.__purchases.size).toBe(1);
  });

  it('accepts a real Stripe-style signed body when secret is set', async () => {
    mocked.__seedEvent({
      id: 'e2',
      ownerId: 'u1',
      endsAt: new Date('2030-06-01'),
      retainUntil: new Date('2030-04-08'),
      createdAt: new Date('2030-04-01'),
      tier: 'FREE',
    });
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_signed';
    const body = makeBody({
      id: 'cs_signed',
      amount_total: 3400,
      currency: 'usd',
      metadata: { eventId: 'e2', productId: 'event_pass_plus', userId: 'u1' },
      customer_email: 'host@example.com',
      payment_status: 'paid',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq(body, { sign: true }) as any);
    expect(res.status).toBe(200);
    expect(mocked.__events.get('e2')!.tier).toBe('EVENT_PASS_PLUS');
  });
});
