/**
 * Per-IP rate limiter backed by Upstash Redis.
 *
 * Falls through to a permissive in-memory pass when `UPSTASH_REDIS_REST_URL` or
 * `UPSTASH_REDIS_REST_TOKEN` is missing. We log a warning so devs notice but
 * never block local development.
 */
export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

interface Limiter {
  limit(key: string): Promise<RateLimitResult>;
}

class NoopLimiter implements Limiter {
  async limit(_key: string): Promise<RateLimitResult> {
    return { success: true, remaining: Number.MAX_SAFE_INTEGER, reset: 0, limit: 0 };
  }
}

class UpstashLimiter implements Limiter {
  private inner: Promise<{ limit: (key: string) => Promise<RateLimitResult> }>;

  constructor(private readonly url: string, private readonly token: string) {
    this.inner = this.build();
  }

  private async build(): Promise<{ limit: (key: string) => Promise<RateLimitResult> }> {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    const redis = new Redis({ url: this.url, token: this.token });
    const limiter = new Ratelimit({
      redis,
      // 10 actions per minute per IP. Tunable later via env if we need.
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: false,
      prefix: 'tinybooth:upload',
    });
    return {
      limit: async (key: string): Promise<RateLimitResult> => {
        const r = await limiter.limit(key);
        return {
          success: r.success,
          remaining: r.remaining,
          reset: r.reset,
          limit: r.limit,
        };
      },
    };
  }

  async limit(key: string): Promise<RateLimitResult> {
    const inner = await this.inner;
    return inner.limit(key);
  }
}

let cached: Limiter | undefined;

/**
 * Build (or reuse) the configured limiter. Permissive when envs absent.
 */
export function getLimiter(): Limiter {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    // eslint-disable-next-line no-console
    console.warn('[rateLimit] Upstash env not set. Allowing all requests.');
    cached = new NoopLimiter();
    return cached;
  }
  cached = new UpstashLimiter(url, token);
  return cached;
}

/**
 * Reset cache. Test-only.
 */
export function __resetLimiterForTests(): void {
  cached = undefined;
}
