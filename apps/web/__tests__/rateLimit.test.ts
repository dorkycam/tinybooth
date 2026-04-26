/**
 * Tests for the rate limiter helper. Verifies the no-op limiter is used when
 * Upstash envs are absent (so local dev never crashes).
 */
import { describe, expect, it } from 'vitest';
import { __resetLimiterForTests, getLimiter } from '../src/lib/rateLimit';

describe('rate limiter', () => {
  it('passes every request when Upstash env is missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    __resetLimiterForTests();
    const limiter = getLimiter();
    const result = await limiter.limit('test-ip');
    expect(result.success).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });
});
