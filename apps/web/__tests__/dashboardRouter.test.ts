/**
 * Unit tests for the `dashboard` tRPC router.
 */
import { describe, expect, it, vi } from 'vitest';
import { dashboardRouter } from '../src/server/api/routers/dashboard';

describe('dashboard router', () => {
  it('events requires auth', async () => {
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: {} as any,
      userId: null,
    });
    await expect(caller.events()).rejects.toThrow();
  });

  it('events returns owner rows when authed', async () => {
    const proxy = {
      event: {
        findMany: vi.fn(async () => [{ id: 'a', ownerId: 'me' }]),
      },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    const list = await caller.events();
    expect(list).toHaveLength(1);
    expect(proxy.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'me' } }),
    );
  });

  it('eventPhotos enforces ownership', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'a', ownerId: 'someone-else' })),
      },
      post: { findMany: vi.fn() },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    await expect(caller.eventPhotos({ eventId: 'a' })).rejects.toThrow();
  });

  it('exportEvent returns deferred Phase 4 result', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'a', ownerId: 'me' })),
      },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    const result = await caller.exportEvent({ eventId: 'a' });
    expect(result.status).toBe('pending');
  });
});
