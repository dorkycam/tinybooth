/**
 * Tests for the account router. Mocks Prisma + storage to verify the cascade
 * delete pulls every owned event's photo blobs out of storage and marks the
 * call successful even when individual storage deletes fail.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { accountRouter } from '../src/server/api/routers/account';
import { __resetStorageForTests } from '../src/lib/storage';

beforeEach(() => {
  __resetStorageForTests();
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  delete process.env.R2_PUBLIC_BASE;
});

describe('account router', () => {
  it('me returns the resolved user and event count', async () => {
    const proxy = {
      event: { count: vi.fn(async () => 3) },
    };
    const caller = accountRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
      userEmail: 'me@example.com',
    });
    const out = await caller.me();
    expect(out.userId).toBe('me');
    expect(out.email).toBe('me@example.com');
    expect(out.ownedEvents).toBe(3);
  });

  it('delete cascades events and best-effort cleans up storage', async () => {
    const txEvents = [{ id: 'e1' }, { id: 'e2' }];
    const photos = [
      { storageKey: 'events/e1/posts/p1/x.webp' },
      { storageKey: 'events/e2/posts/p2/y.webp' },
      { storageKey: '' },
    ];
    const proxy = {
      event: {
        findMany: vi.fn(async () => txEvents),
        deleteMany: vi.fn(async () => ({ count: 2 })),
      },
      photo: { findMany: vi.fn(async () => photos) },
      user: {
        findUnique: vi.fn(async () => ({ id: 'me' })),
        delete: vi.fn(async () => ({ id: 'me' })),
      },
      $transaction: vi.fn(
        async (
          fn: (tx: typeof proxy) => Promise<unknown>,
        ): Promise<unknown> => fn(proxy),
      ),
    };
    const caller = accountRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
      userEmail: null,
    });
    const result = await caller.delete();
    expect(result.ok).toBe(true);
    expect(result.deletedEvents).toBe(2);
    // Two photos with valid keys; the empty-string entry is skipped.
    expect(result.deletedPhotoBlobs).toBe(2);
    expect(result.storageErrors).toBe(0);
    expect(proxy.event.deleteMany).toHaveBeenCalledOnce();
    expect(proxy.user.delete).toHaveBeenCalledOnce();
  });

  it('delete still returns ok when the user row was never created', async () => {
    const proxy = {
      event: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
      photo: { findMany: vi.fn(async () => []) },
      user: {
        findUnique: vi.fn(async () => null),
        delete: vi.fn(),
      },
      $transaction: vi.fn(
        async (
          fn: (tx: typeof proxy) => Promise<unknown>,
        ): Promise<unknown> => fn(proxy),
      ),
    };
    const caller = accountRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
      userEmail: null,
    });
    const result = await caller.delete();
    expect(result.ok).toBe(true);
    expect(proxy.user.delete).not.toHaveBeenCalled();
  });

  it('delete throws INTERNAL_SERVER_ERROR when the cascade fails', async () => {
    const proxy = {
      event: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(async () => ({ count: 0 })),
      },
      photo: { findMany: vi.fn(async () => []) },
      user: { findUnique: vi.fn(), delete: vi.fn() },
      $transaction: vi.fn(async () => {
        throw new Error('db went away');
      }),
    };
    const caller = accountRouter.createCaller({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: proxy as any,
      userId: 'me',
      userEmail: null,
    });
    await expect(caller.delete()).rejects.toThrow(/db went away/);
  });
});
