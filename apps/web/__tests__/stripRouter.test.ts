/**
 * Unit tests for the `strip` tRPC router.
 */
import { describe, expect, it, vi } from 'vitest';
import { stripRouter } from '../src/server/api/routers/strip';

describe('strip router', () => {
  it('create requires the parent event when eventId is provided', async () => {
    const proxy = {
      event: { findUnique: vi.fn(async () => null) },
      strip: { create: vi.fn() },
    };
    const caller = stripRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    await expect(
      caller.create({
        eventId: 'missing',
        layout: '1x4_classic',
        photos: [{ url: 'https://x/a.webp', storageKey: 'k', width: 0, height: 0, order: 0 }],
      }),
    ).rejects.toThrow();
  });

  it('create works for standalone strips with no eventId', async () => {
    const proxy = {
      event: { findUnique: vi.fn() },
      strip: {
        create: vi.fn(async ({ data }: { data: { layout: string } }) => ({
          id: 's1',
          layout: data.layout,
          photos: [],
        })),
      },
    };
    const caller = stripRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: null,
    });
    const out = await caller.create({
      layout: '2x2',
      photos: [{ url: 'https://x/a.webp', storageKey: 'k', width: 0, height: 0, order: 0 }],
    });
    expect(out.layout).toBe('2x2');
    expect(proxy.event.findUnique).not.toHaveBeenCalled();
  });
});
