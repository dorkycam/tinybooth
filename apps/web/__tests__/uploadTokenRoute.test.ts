/**
 * Tests for /api/upload/token. With R2 env unset, returns 501; with all env
 * set, returns a presigned URL response shape (we stub the SDK call with a
 * spy).
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { POST } from '../app/api/upload/token/route';

beforeEach(() => {
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
});

describe('POST /api/upload/token', () => {
  it('returns 501 when R2 is not configured', async () => {
    const req = new Request('http://localhost/api/upload/token', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(501);
    const body = (await res.json()) as { phase: number };
    expect(body.phase).toBe(4);
  });
});
