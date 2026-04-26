/**
 * Cleanup logic shared by the cron handler and the test suite. Pulled into
 * its own module so tests can pass a frozen `now` and a mock db/storage.
 *
 * Two passes:
 *   1. Expired events: find events past `retainUntil`, delete their R2
 *      photos, then drop the rows (cascades to posts/strips/photos/messages).
 *   2. Expired exports: find Export rows whose 24h signed URL has expired,
 *      delete the zip from storage, then drop the row.
 */
import type { Storage } from './storage';

export interface CleanupSummary {
  expiredEvents: number;
  deletedPhotos: number;
  storageDeletions: number;
  storageErrors: number;
  expiredExports: number;
}

/**
 * Minimal Prisma-shaped surface this module touches. Defined structurally
 * (not via `import { PrismaClient }`) so the test suite can pass an
 * in-memory mock. Production passes the real PrismaClient, which structurally
 * satisfies these methods.
 */
interface CleanupDb {
  event: {
    findMany(args: {
      where: { retainUntil: { lt: Date } };
      select: { id: true };
    }): Promise<Array<{ id: string }>>;
    deleteMany(args: { where: { id: { in: string[] } } }): Promise<unknown>;
  };
  photo: {
    findMany(args: {
      where: { OR: Array<{ post: { eventId: { in: string[] } } } | { strip: { eventId: { in: string[] } } }> };
      select: { id: true; storageKey: true };
    }): Promise<Array<{ id: string; storageKey: string | null }>>;
  };
  export?: {
    findMany?(args: {
      where: { expiresAt: { lt: Date }; status: 'READY' };
      select: { id: true; storageKey: true };
    }): Promise<Array<{ id: string; storageKey: string | null }>>;
    deleteMany?(args: { where: { id: { in: string[] } } }): Promise<unknown>;
  };
}

interface CleanupContext {
  db: CleanupDb;
  storage: Storage;
  now: Date;
}

/**
 * Find expired events + exports, delete their R2 objects, then drop the DB
 * rows. Returns a summary suitable for logging and surfacing in the cron
 * response.
 */
export async function runCleanup(ctx: CleanupContext): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    expiredEvents: 0,
    deletedPhotos: 0,
    storageDeletions: 0,
    storageErrors: 0,
    expiredExports: 0,
  };

  // Pass 1: expired events.
  const expired = await ctx.db.event.findMany({
    where: { retainUntil: { lt: ctx.now } },
    select: { id: true },
  });
  summary.expiredEvents = expired.length;

  if (expired.length > 0) {
    const eventIds = expired.map((e) => e.id);
    const photos = await ctx.db.photo.findMany({
      where: {
        OR: [
          { post: { eventId: { in: eventIds } } },
          { strip: { eventId: { in: eventIds } } },
        ],
      },
      select: { id: true, storageKey: true },
    });
    summary.deletedPhotos = photos.length;

    for (const p of photos) {
      if (!p.storageKey) continue;
      try {
        await ctx.storage.deleteObject(p.storageKey);
        summary.storageDeletions += 1;
      } catch {
        summary.storageErrors += 1;
      }
    }

    await ctx.db.event.deleteMany({ where: { id: { in: eventIds } } });
  }

  // Pass 2: expired exports.
  if (ctx.db.export?.findMany && ctx.db.export?.deleteMany) {
    const exports = await ctx.db.export.findMany({
      where: { expiresAt: { lt: ctx.now }, status: 'READY' },
      select: { id: true, storageKey: true },
    });
    summary.expiredExports = exports.length;
    for (const e of exports) {
      if (e.storageKey) {
        try {
          await ctx.storage.deleteObject(e.storageKey);
          summary.storageDeletions += 1;
        } catch {
          summary.storageErrors += 1;
        }
      }
    }
    if (exports.length > 0) {
      await ctx.db.export.deleteMany({
        where: { id: { in: exports.map((x) => x.id) } },
      });
    }
  }

  return summary;
}
