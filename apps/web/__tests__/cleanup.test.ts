/**
 * Tests for the cleanup cron logic with frozen time.
 */
import { describe, expect, it, vi } from 'vitest';
import { runCleanup } from '../src/lib/cleanup';
import type { Storage, StorageResult } from '../src/lib/storage';

class StubStorage implements Storage {
  public deletes: string[] = [];
  async uploadBuffer(): Promise<StorageResult> {
    throw new Error('not used');
  }
  async deleteObject(key: string): Promise<void> {
    this.deletes.push(key);
  }
}

describe('runCleanup', () => {
  it('deletes expired events + their photos and returns a summary', async () => {
    const storage = new StubStorage();
    const now = new Date('2030-01-01T00:00:00Z');
    const expired = [
      { id: 'e1' },
      { id: 'e2' },
    ];
    const photos = [
      { id: 'p1', storageKey: 'events/e1/posts/p/a.webp' },
      { id: 'p2', storageKey: 'events/e2/posts/p/b.webp' },
    ];
    const db = {
      event: {
        findMany: vi.fn(async () => expired),
        deleteMany: vi.fn(async () => ({ count: expired.length })),
      },
      photo: {
        findMany: vi.fn(async () => photos),
      },
    };
    const summary = await runCleanup({ db, storage, now });
    expect(summary.expiredEvents).toBe(2);
    expect(summary.deletedPhotos).toBe(2);
    expect(summary.storageDeletions).toBe(2);
    expect(summary.storageErrors).toBe(0);
    expect(summary.expiredExports).toBe(0);
    expect(storage.deletes).toEqual([
      'events/e1/posts/p/a.webp',
      'events/e2/posts/p/b.webp',
    ]);
    expect(db.event.deleteMany).toHaveBeenCalledOnce();
  });

  it('no-ops cleanly when nothing is expired', async () => {
    const storage = new StubStorage();
    const db = {
      event: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(),
      },
      photo: { findMany: vi.fn() },
    };
    const summary = await runCleanup({ db, storage, now: new Date() });
    expect(summary.expiredEvents).toBe(0);
    expect(summary.deletedPhotos).toBe(0);
    expect(summary.expiredExports).toBe(0);
    expect(db.event.deleteMany).not.toHaveBeenCalled();
  });

  it('counts storage errors without aborting', async () => {
    const storage: Storage = {
      uploadBuffer: async () => ({ url: '', key: '' }),
      deleteObject: async () => {
        throw new Error('boom');
      },
    };
    const db = {
      event: {
        findMany: vi.fn(async () => [{ id: 'e1' }]),
        deleteMany: vi.fn(async () => ({ count: 1 })),
      },
      photo: { findMany: vi.fn(async () => [{ id: 'p1', storageKey: 'k' }]) },
    };
    const summary = await runCleanup({ db, storage, now: new Date() });
    expect(summary.storageErrors).toBe(1);
    expect(summary.storageDeletions).toBe(0);
    expect(db.event.deleteMany).toHaveBeenCalledOnce();
  });

  it('also sweeps expired Export rows + their zips', async () => {
    const storage = new StubStorage();
    const expiredExports = [
      { id: 'x1', storageKey: 'events/e1/exports/x1.zip' },
      { id: 'x2', storageKey: null },
    ];
    const db = {
      event: {
        findMany: vi.fn(async () => []),
        deleteMany: vi.fn(),
      },
      photo: { findMany: vi.fn() },
      export: {
        findMany: vi.fn(async () => expiredExports),
        deleteMany: vi.fn(async () => ({ count: 2 })),
      },
    };
    const summary = await runCleanup({ db, storage, now: new Date() });
    expect(summary.expiredExports).toBe(2);
    expect(summary.storageDeletions).toBe(1);
    expect(storage.deletes).toEqual(['events/e1/exports/x1.zip']);
    expect(db.export.deleteMany).toHaveBeenCalledOnce();
  });
});
