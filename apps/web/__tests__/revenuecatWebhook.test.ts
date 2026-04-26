/**
 * Tests for the RevenueCat webhook. We mock the Prisma client by intercepting
 * the module import so the route resolves without a real DB.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/db', () => {
  const purchases = new Map<string, unknown>();
  const events = new Map<string, { id: string; endsAt: Date | null; tier: string }>();
  return {
    db: {
      purchase: {
        upsert: vi.fn(
          async ({
            create,
          }: {
            create: { source: string; externalId: string; eventId: string | null; product: string };
          }) => {
            const id = `pu_${purchases.size + 1}`;
            const row = { id, ...create };
            purchases.set(id, row);
            return row;
          },
        ),
      },
      event: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => events.get(where.id) ?? null),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: { tier: string; retainUntil: Date };
          }) => {
            const next = { id: where.id, endsAt: null, ...data };
            events.set(where.id, next as { id: string; endsAt: Date | null; tier: string });
            return next;
          },
        ),
      },
      __seedEvent(ev: { id: string; endsAt: Date | null; tier: string }): void {
        events.set(ev.id, ev);
      },
      __purchases: purchases,
      __events: events,
    },
  };
});

import { POST } from '../app/api/webhooks/revenuecat/route';
import { db } from '../src/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mocked = db as any;

beforeEach(() => {
  process.env.REVENUECAT_WEBHOOK_SECRET = 'shh';
});

function makeReq(body: unknown, auth: string): Request {
  return new Request('http://localhost/api/webhooks/revenuecat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: auth,
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/webhooks/revenuecat', () => {
  it('returns 503 when secret env is missing', async () => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
    const req = makeReq({}, 'Bearer wrong');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(503);
  });

  it('returns 401 when signature mismatches', async () => {
    const req = makeReq({}, 'Bearer wrong');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('upserts the Purchase row and applies tier on event_pass', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mocked as any).__seedEvent({ id: 'ev1', endsAt: new Date('2030-06-01'), tier: 'FREE' });
    const ev = {
      type: 'INITIAL_PURCHASE',
      app_user_id: 'user_1',
      product_id: 'event_pass',
      store: 'STRIPE',
      transaction_id: 'tx_1',
      price_in_purchased_currency: 12.99,
      currency: 'USD',
      metadata: { eventId: 'ev1' },
    };
    const req = makeReq({ event: ev }, 'Bearer shh');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = (mocked as any).__events.get('ev1');
    expect(updated.tier).toBe('EVENT_PASS');
  });

  it('ignores non-purchase event types', async () => {
    const ev = {
      type: 'CANCELLATION',
      app_user_id: 'u',
      product_id: 'event_pass',
      store: 'STRIPE',
      transaction_id: 'tx_2',
    };
    const req = makeReq({ event: ev }, 'Bearer shh');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ignored?: boolean };
    expect(body.ignored).toBe(true);
  });
});
