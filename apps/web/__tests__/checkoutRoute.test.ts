/**
 * Tests for POST /api/checkout. Stub Stripe + in-memory db mock + debug-header
 * auth fallback.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';

interface MockEvent {
  id: string;
  ownerId: string | null;
}

vi.mock('../src/lib/db', () => {
  const events = new Map<string, MockEvent>();
  return {
    db: {
      event: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return events.get(where.id) ?? null;
        }),
      },
      __seedEvent(ev: MockEvent): void {
        events.set(ev.id, ev);
      },
      __reset(): void {
        events.clear();
      },
    },
  };
});

import { POST } from '../app/api/checkout/route';
import { db } from '../src/lib/db';
import { __resetStripeStubForTests } from '../src/lib/stripe';

interface MockedDb {
  __seedEvent(ev: MockEvent): void;
  __reset(): void;
}
const mocked = db as unknown as MockedDb;

beforeEach(() => {
  __resetStripeStubForTests();
  mocked.__reset();
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_WEB_BASE_URL;
});

function makeReq(body: unknown, opts: { auth?: string } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.auth) headers['x-debug-user-id'] = opts.auth;
  return new Request('https://x.local/api/checkout', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/checkout', () => {
  it('returns 401 when unauthenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq({}) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when body lacks fields', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({}, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for unknown product id', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1', productId: 'mystery' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for products not sold on the web (Strip Unlock)', async () => {
    mocked.__seedEvent({ id: 'e1', ownerId: 'u1' });
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1', productId: 'strip_unlock' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(400);
  });

  it('returns 404 when the event is missing', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'gone', productId: 'event_pass' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when the caller does not own the event', async () => {
    mocked.__seedEvent({ id: 'e1', ownerId: 'someone-else' });
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1', productId: 'event_pass' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(403);
  });

  it('returns a stub session id and url when auth + product + event check out', async () => {
    mocked.__seedEvent({ id: 'e1', ownerId: 'u1' });
    process.env.NEXT_PUBLIC_WEB_BASE_URL = 'https://tinybooth.test';
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1', productId: 'event_pass' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; url: string };
    expect(body.id).toMatch(/^cs_test_local_/);
    expect(body.url).toContain('https://tinybooth.test/dashboard/events/e1');
    expect(body.url).toContain('purchase=success');
  });
});
