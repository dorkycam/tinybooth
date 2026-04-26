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

  it('exportEvent rejects FREE-tier events with FORBIDDEN', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'a', ownerId: 'me', tier: 'FREE' })),
      },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    await expect(caller.exportEvent({ eventId: 'a' })).rejects.toThrow(/Event Pass/);
  });

  it('exportEvent inserts a PENDING export row when paid', async () => {
    // The router fires the export job in the background; mock just enough of
    // the prisma surface that the job can run end-to-end without touching any
    // network.
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({
          id: 'a',
          ownerId: 'me',
          tier: 'EVENT_PASS',
          name: 'X',
          slug: 'x',
        })),
      },
      photo: { findMany: vi.fn(async () => []) },
      export: {
        create: vi.fn(async ({ data }: { data: { status: string } }) => ({
          id: 'x1',
          status: data.status,
        })),
        update: vi.fn(async () => null),
      },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
      userEmail: null,
    });
    const out = await caller.exportEvent({ eventId: 'a' });
    expect(out.exportId).toBe('x1');
    expect(out.status).toBe('PENDING');
    expect(proxy.export.create).toHaveBeenCalledOnce();
  });

  it('exportStatus returns the row when caller owns it', async () => {
    const exp = {
      id: 'x1',
      userId: 'me',
      status: 'READY',
      signedUrl: 'https://example.com/x.zip',
      expiresAt: new Date(),
      errorMsg: null,
      createdAt: new Date(),
      completedAt: new Date(),
    };
    const proxy = {
      export: { findUnique: vi.fn(async () => exp) },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    const result = await caller.exportStatus({ exportId: 'x1' });
    expect(result.status).toBe('READY');
  });

  it('eventStats returns counts and retention countdown', async () => {
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({
          id: 'a',
          ownerId: 'me',
          tier: 'EVENT_PASS',
          retainUntil: futureDate,
          emailDeliveries: 4,
          smsDeliveries: 1,
        })),
      },
      post: { count: vi.fn(async () => 12) },
      strip: { count: vi.fn(async () => 3) },
      photo: { count: vi.fn(async () => 33) },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    const stats = await caller.eventStats({ eventId: 'a' });
    expect(stats.posts).toBe(12);
    expect(stats.strips).toBe(3);
    expect(stats.photos).toBe(33);
    expect(stats.retentionDaysRemaining).toBeGreaterThanOrEqual(4);
    expect(stats.retentionDaysRemaining).toBeLessThanOrEqual(5);
  });

  it('pairingCode returns a tinybooth:// url with id + code params', async () => {
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
    const result = await caller.pairingCode({ eventId: 'a' });
    expect(result.url.startsWith('tinybooth://event?id=a&code=')).toBe(true);
    expect(result.code.length).toBeGreaterThan(10);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('pairingCode rejects when caller does not own the event', async () => {
    const proxy = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'a', ownerId: 'someone-else' })),
      },
    };
    const caller = dashboardRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
    });
    await expect(caller.pairingCode({ eventId: 'a' })).rejects.toThrow();
  });
});
