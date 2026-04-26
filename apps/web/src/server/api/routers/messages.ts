/**
 * Messages router. Returns the static random-message library merged with any
 * per-event custom messages added by the host (paid-tier feature).
 */
import { z } from 'zod';
import { STATIC_MESSAGES } from '@tinybooth/messages';
import { router, publicProcedure } from '../trpc';

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
});
