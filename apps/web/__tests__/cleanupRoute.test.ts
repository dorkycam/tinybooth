/**
 * Smoke test for /api/cron/cleanup. Verifies the auth guard fires when
 * CRON_SECRET is set, and that the route returns the runCleanup summary
 * shape otherwise.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/db', () => ({
  db: {
    event: { findMany: vi.fn(async () => []), deleteMany: vi.fn() },
    photo: { findMany: vi.fn(async () => []) },
  },
}));

import { GET } from '../app/api/cron/cleanup/route';

beforeEach(() => {
  delete process.env.CRON_SECRET;
});

describe('GET /api/cron/cleanup', () => {
  it('returns 401 when CRON_SECRET set and no auth header', async () => {
    process.env.CRON_SECRET = 'shh';
    const req = new Request('http://localhost/api/cron/cleanup');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await GET(req as any);
    expect(res.status).toBe(401);
  });

  it('returns the cleanup summary on success', async () => {
    const req = new Request('http://localhost/api/cron/cleanup');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { expiredEvents: number };
    expect(body.expiredEvents).toBe(0);
  });
});
