/**
 * Post router. `create` is public (TinyWall guests have no account); `list` is
 * the read used by the wall TV display + the polling fallback when Supabase
 * Realtime is unavailable.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { evaluateEvent } from '@tinybooth/billing';
import { router, publicProcedure } from '../trpc';
import { clean } from '../../../lib/profanity';

const PhotoInput = z.object({
  url: z.string().url(),
  storageKey: z.string().min(1),
  mediaType: z.enum(['image', 'video']).default('image'),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  order: z.number().int().nonnegative().default(0),
});

const CAPTION_MAX = 100;

/**
 * Sanitize a caption: trim, strip URLs and HTML, enforce max length, and
 * profanity-clean. Mirrors the original TinyWall sanitization so existing data
 * stays consistent.
 */
function sanitizeCaption(input: string | null | undefined): string | null {
  if (!input) return null;
  const stripped = input
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '')
    .replace(/\S+\.(com|org|net|io|co|me|dev|app|xyz)\S*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (stripped.length === 0) return null;
  return clean(stripped).slice(0, CAPTION_MAX);
}

export const postRouter = router({
  /**
   * Create a guest post. Validates the parent event exists and isn't expired,
   * then writes the Post + nested Photos in a single transaction.
   */
  create: publicProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        caption: z.string().max(500).optional(),
        photos: z.array(PhotoInput).min(1).max(10),
        uploaderToken: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found.' });
      if (event.retainUntil.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'This event is no longer accepting uploads.',
        });
      }
      // Guest cap enforcement. FREE: 100 uploads. EVENT_PASS: 150. PLUS: unlimited.
      const ent = evaluateEvent({
        id: event.id,
        tier: event.tier,
        endsAt: event.endsAt,
        createdAt: event.createdAt,
        emailDeliveries: event.emailDeliveries,
        smsDeliveries: event.smsDeliveries,
      });
      if (ent.guestCap !== null) {
        const currentCount = await ctx.db.post.count({ where: { eventId: input.eventId } });
        if (currentCount >= ent.guestCap) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Guest upload cap reached (${ent.guestCap}). Ask the host to upgrade the event.`,
          });
        }
      }
      const caption = sanitizeCaption(input.caption);
      const post = await ctx.db.post.create({
        data: {
          eventId: input.eventId,
          caption,
          uploaderToken: input.uploaderToken ?? null,
          photos: {
            create: input.photos.map((p, idx) => ({
              url: p.url,
              storageKey: p.storageKey,
              mediaType: p.mediaType,
              width: p.width,
              height: p.height,
              order: p.order || idx,
            })),
          },
        },
        include: { photos: true },
      });
      return post;
    }),

  /**
   * List posts for an event, newest first. `since` allows incremental
   * polling (the realtime fallback path uses this).
   */
  list: publicProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        since: z.date().optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db.post.findMany({
        where: {
          eventId: input.eventId,
          approved: true,
          ...(input.since ? { createdAt: { gt: input.since } } : {}),
        },
        include: { photos: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        take: input.limit,
      });
      return posts;
    }),
});

export { sanitizeCaption };
