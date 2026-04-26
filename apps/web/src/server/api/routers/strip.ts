/**
 * Strip router. Records a TinyBooth-rendered photostrip. Phase 1 only stores
 * the metadata + photo references; Phase 2 wires the actual Skia/Sharp render.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

const PhotoInput = z.object({
  url: z.string().url(),
  storageKey: z.string().min(1),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  order: z.number().int().nonnegative().default(0),
});

const LayoutEnum = z.enum(['1x4_classic', '2x2', '1x3', 'single', '1x6_double']);

export const stripRouter = router({
  /**
   * Create a strip. `eventId` is optional (standalone strips never upload to
   * the cloud, but if a strip is tied to an event we record it).
   */
  create: publicProcedure
    .input(
      z.object({
        eventId: z.string().min(1).optional(),
        layout: LayoutEnum,
        photos: z.array(PhotoInput).min(1).max(6),
        watermarkRemoved: z.boolean().default(false),
        igShareUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.eventId) {
        const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
        if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found.' });
      }
      const strip = await ctx.db.strip.create({
        data: {
          eventId: input.eventId ?? null,
          layout: input.layout,
          watermarkRemoved: input.watermarkRemoved,
          igShareUrl: input.igShareUrl ?? null,
          photos: {
            create: input.photos.map((p, idx) => ({
              url: p.url,
              storageKey: p.storageKey,
              mediaType: 'image',
              width: p.width,
              height: p.height,
              order: p.order || idx,
            })),
          },
        },
        include: { photos: true },
      });
      return strip;
    }),
});
