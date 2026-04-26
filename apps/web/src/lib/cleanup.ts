/**
 * Cleanup logic shared by the cron handler and the test suite. Pulled into
 * its own module so tests can pass a frozen `now` and a mock db/storage.
 */
import type { Storage } from './storage';

export interface CleanupSummary {
  expiredEvents: number;
  deletedPhotos: number;
  storageDeletions: number;
  storageErrors: number;
}

interface CleanupContext {
  // Loose typing here keeps the test mock simple. Production passes the real
  // Prisma client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any;
  storage: Storage;
  now: Date;
}

/**
 * Find expired events, delete their R2 objects, then drop the DB rows. Returns
 * a summary suitable for logging and surfacing in the cron response.
 */
export async function runCleanup(ctx: CleanupContext): Promise<CleanupSummary> {
  const summary: CleanupSummary = {
    expiredEvents: 0,
    deletedPhotos: 0,
    storageDeletions: 0,
    storageErrors: 0,
  };

  const expired = await ctx.db.event.findMany({
    where: { retainUntil: { lt: ctx.now } },
    select: { id: true },
  });
  summary.expiredEvents = expired.length;
  if (expired.length === 0) return summary;

  const eventIds = expired.map((e: { id: string }) => e.id);

  // Pull every Photo we need to remove from storage. Posts and Strips both
  // belong to events; Photo is the leaf with a storageKey.
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

  for (const p of photos as Array<{ storageKey: string }>) {
    if (!p.storageKey) continue;
    try {
      await ctx.storage.deleteObject(p.storageKey);
      summary.storageDeletions += 1;
    } catch {
      summary.storageErrors += 1;
    }
  }

  // Cascading deletes drop Posts, Strips, Photos, and CustomMessages with the
  // event row.
  await ctx.db.event.deleteMany({ where: { id: { in: eventIds } } });

  return summary;
}
