/**
 * Dashboard router. Owner-only reads + a stub for the bulk export endpoint
 * that Phase 4 wires to a real signed R2 zip URL.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const dashboardRouter = router({
  /** List events owned by the calling user. */
  events: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.event.findMany({
      where: { ownerId: ctx.userId },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /** Photos for a single event the caller owns. */
  eventPhotos: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const posts = await ctx.db.post.findMany({
        where: { eventId: input.eventId },
        include: { photos: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      });
      return posts;
    }),

  /**
   * Build (or, in Phase 1, stub) a signed export URL for an event. The Phase 4
   * implementation will assemble a zip in R2 and return a 24h-signed URL.
   */
  exportEvent: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      // Phase 1 returns a deferred result. Phase 4 wires the real export job.
      return {
        status: 'pending' as const,
        message: 'Bulk export ships in Phase 4.',
        eventId: input.eventId,
      };
    }),
});
