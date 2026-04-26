/**
 * Integration test for the tRPC context builder + protectedProcedure guard.
 *
 * Exercises the debug-header path (since the test runs without Supabase envs)
 * to confirm the auth wiring matches what production-bound clients expect.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createContext, contextFromSession } from '../src/server/api/trpc';
import { dashboardRouter } from '../src/server/api/routers/dashboard';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NODE_ENV = 'test';
});

describe('createContext', () => {
  it('returns a null userId when no auth header is present', async () => {
    const req = new Request('http://localhost/api/trpc/x');
    const ctx = await createContext(req);
    expect(ctx.userId).toBeNull();
    expect(ctx.userEmail).toBeNull();
  });

  it('reads x-debug-user-id when supabase envs are missing', async () => {
    const req = new Request('http://localhost/api/trpc/x', {
      headers: { 'x-debug-user-id': 'user-99' },
    });
    const ctx = await createContext(req);
    expect(ctx.userId).toBe('user-99');
  });

  it('exposes the debug email when provided', async () => {
    const req = new Request('http://localhost/api/trpc/x', {
      headers: {
        'x-debug-user-id': 'user-99',
        'x-debug-user-email': 'host@example.com',
      },
    });
    const ctx = await createContext(req);
    expect(ctx.userEmail).toBe('host@example.com');
  });

  it('propagates context into protectedProcedure (success path)', async () => {
    const ctx = contextFromSession({
      userId: 'me',
      user: { id: 'me', email: null },
      accessToken: 'tok',
      expiresAt: null,
    });
    const proxy = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { findMany: async (): Promise<any[]> => [] },
    };
    const caller = dashboardRouter.createCaller({ ...ctx, db: proxy as unknown as typeof ctx.db });
    const list = await caller.events();
    expect(list).toEqual([]);
  });

  it('protectedProcedure rejects without a session', async () => {
    const ctx = contextFromSession(null);
    const caller = dashboardRouter.createCaller({
      ...ctx,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: {} as any,
    });
    await expect(caller.events()).rejects.toBeInstanceOf(TRPCError);
  });
});
