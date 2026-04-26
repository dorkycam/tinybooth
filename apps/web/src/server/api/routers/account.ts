/**
 * Account router. The Apple-required `delete` endpoint cascades the user's
 * data: every owned event is dropped (Prisma onDelete: Cascade handles
 * posts/strips/photos/messages/exports), then the User row, then a best-
 * effort sweep of R2 objects under each event prefix.
 *
 * The R2 sweep is best-effort with logging because partial storage failure
 * shouldn't block the row delete (the cleanup cron picks up orphans later).
 */
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { getStorage } from '../../../lib/storage';

export interface AccountDeleteResult {
  ok: true;
  deletedEvents: number;
  deletedPhotoBlobs: number;
  storageErrors: number;
}

export const accountRouter = router({
  /**
   * Whoami. Returns the resolved auth user fields plus a count of owned
   * events. Useful for the dashboard shell to render "Signed in as ...".
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const ownedEvents = await ctx.db.event.count({ where: { ownerId: ctx.userId } });
    return {
      userId: ctx.userId,
      email: ctx.userEmail ?? null,
      ownedEvents,
    };
  }),

  /**
   * Permanently delete the current user. Required by Apple App Review since
   * June 2022 (Guideline 5.1.1(v)). Wraps the cascade in a single transaction;
   * the storage sweep runs after the transaction commits so a slow R2 call
   * never holds an open DB tx.
   */
  delete: protectedProcedure.mutation(async ({ ctx }): Promise<AccountDeleteResult> => {
    const storage = getStorage();
    const events = await ctx.db.event.findMany({
      where: { ownerId: ctx.userId },
      select: { id: true },
    });
    const eventIds = events.map((e) => e.id);

    // Pull every photo storage key under the user's events first (we need
    // them for the storage sweep but they will be cascade-deleted below).
    let photos: Array<{ storageKey: string }> = [];
    if (eventIds.length > 0) {
      photos = await ctx.db.photo.findMany({
        where: {
          OR: [
            { post: { eventId: { in: eventIds } } },
            { strip: { eventId: { in: eventIds } } },
          ],
        },
        select: { storageKey: true },
      });
    }

    // Drop every owned event (cascades posts/strips/photos/messages/exports)
    // then the user row, in a single interactive transaction. If the user
    // row does not exist (e.g. row was never written by the auth trigger)
    // we still consider the deletion successful since there is nothing to
    // remove. If any other failure happens, surface a typed error so the
    // client can retry.
    try {
      await ctx.db.$transaction(async (tx) => {
        await tx.event.deleteMany({ where: { ownerId: ctx.userId } });
        const existing = await tx.user.findUnique({ where: { id: ctx.userId } });
        if (existing) {
          await tx.user.delete({ where: { id: ctx.userId } });
        }
      });
    } catch (err) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Account deletion failed.',
      });
    }

    // Best-effort storage sweep. We log misses but never throw.
    let deletedPhotoBlobs = 0;
    let storageErrors = 0;
    for (const p of photos) {
      if (!p.storageKey) continue;
      try {
        await storage.deleteObject(p.storageKey);
        deletedPhotoBlobs += 1;
      } catch (err) {
        storageErrors += 1;
        // eslint-disable-next-line no-console
        console.warn(`[account.delete] storage delete failed for ${p.storageKey}:`, err);
      }
    }

    return {
      ok: true,
      deletedEvents: eventIds.length,
      deletedPhotoBlobs,
      storageErrors,
    };
  }),
});
