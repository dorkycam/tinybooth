/**
 * Tests for /api/upload/token (Phase 4 entitlement check).
 *
 * - Unauthed: 401.
 * - Bad body: 400.
 * - Free event: 403 with TIER_REQUIRED.
 * - Paid event, no R2: stub URL with `stub: true`.
 */
import { describe, expect, it, beforeEach, vi } from 'vitest';

interface MockEvent {
  id: string;
  ownerId: string | null;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  endsAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
  emailDeliveries: number;
  smsDeliveries: number;
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

import { POST } from '../app/api/upload/token/route';
import { db } from '../src/lib/db';

interface MockedDb {
  __seedEvent(ev: MockEvent): void;
  __reset(): void;
}
const mocked = db as unknown as MockedDb;

beforeEach(() => {
  mocked.__reset();
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
});

function makeReq(body: unknown, opts: { auth?: string } = {}): Request {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.auth) headers['x-debug-user-id'] = opts.auth;
  return new Request('https://x/api/upload/token', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/upload/token', () => {
  it('returns 401 when no session', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq({}) as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 when eventId missing', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(makeReq({}, { auth: 'u1' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns 404 when event missing', async () => {
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'gone' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(404);
  });

  it('returns 403 when not owner', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'someone-else',
      tier: 'EVENT_PASS',
      endsAt: new Date(),
      retainUntil: new Date(),
      createdAt: new Date(),
      emailDeliveries: 0,
      smsDeliveries: 0,
    });
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 with TIER_REQUIRED on FREE tier', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'u1',
      tier: 'FREE',
      endsAt: null,
      retainUntil: new Date(),
      createdAt: new Date(),
      emailDeliveries: 0,
      smsDeliveries: 0,
    });
    const res = await POST(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      makeReq({ eventId: 'e1' }, { auth: 'u1' }) as any,
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('TIER_REQUIRED');
  });

  it('returns a stub URL for paid events without R2 envs', async () => {
    mocked.__seedEvent({
      id: 'e1',
      ownerId: 'u1',
      tier: 'EVENT_PASS_PLUS',
      endsAt: new Date(),
      retainUntil: new Date(),
      createdAt: new Date(),
      emailDeliveries: 0,
      smsDeliveries: 0,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = makeReq({ eventId: 'e1', filename: 'a.mp4' }, { auth: 'u1' }) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { uploadUrl: string; stub?: boolean };
    expect(body.stub).toBe(true);
    expect(body.uploadUrl).toContain('stub.tinybooth.local');
  });
});
