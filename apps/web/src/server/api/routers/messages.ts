/**
 * Messages router. Returns the static random-message library merged with any
 * per-event custom messages added by the host (paid-tier feature).
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { STATIC_MESSAGES } from '@tinybooth/messages';
import { router, publicProcedure, protectedProcedure } from '../trpc';

const MAX_CUSTOM_MESSAGE_LEN = 80;

export const messagesRouter = router({
  /**
   * List messages. If `eventId` is provided, append the event's custom
   * messages to the static pool.
   */
  list: publicProcedure
    .input(z.object({ eventId: z.string().min(1).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const base = STATIC_MESSAGES.slice();
      if (!input?.eventId) return base;
      const customs = await ctx.db.customMessage.findMany({
        where: { eventId: input.eventId },
        orderBy: { createdAt: 'asc' },
      });
      return base.concat(customs.map((c) => c.text));
    }),

  /**
   * Add a custom message to the event's pool. Owner-only and paid-tier only.
   * Returns a typed FORBIDDEN with `{ code: 'TIER_REQUIRED', requiredTier }`
   * shape so the client can render a paywall instead of a generic error.
   */
  add: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        text: z.string().min(1).max(MAX_CUSTOM_MESSAGE_LEN),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (event.tier === 'FREE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({ code: 'TIER_REQUIRED', requiredTier: 'EVENT_PASS' }),
        });
      }
      const created = await ctx.db.customMessage.create({
        data: { eventId: input.eventId, text: input.text.trim() },
      });
      return created;
    }),

  /** Delete a custom message. Owner-only. */
  delete: protectedProcedure
    .input(z.object({ messageId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.customMessage.findUnique({
        where: { id: input.messageId },
        include: { event: { select: { ownerId: true } } },
      });
      if (!message) throw new TRPCError({ code: 'NOT_FOUND' });
      if (message.event.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await ctx.db.customMessage.delete({ where: { id: input.messageId } });
      return { ok: true } as const;
    }),
});
