/**
 * Strip router.
 *   - `create`: record a TinyBooth-rendered photostrip.
 *   - `deliver`: send the strip's URL via email or SMS to a guest, gated by
 *     event tier + per-event delivery quotas (50 / 250 per Event Pass / Plus).
 *     Decrements `Event.emailDeliveries` or `Event.smsDeliveries` on success.
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { evaluateEvent } from '@tinybooth/billing';
import { router, publicProcedure } from '../trpc';
import { sendStripDelivery } from '../../../lib/email';
import { sendSms } from '../../../lib/sms';

const PhotoInput = z.object({
  url: z.string().url(),
  storageKey: z.string().min(1),
  width: z.number().int().nonnegative().default(0),
  height: z.number().int().nonnegative().default(0),
  order: z.number().int().nonnegative().default(0),
});

const LayoutEnum = z.enum(['1x4_classic', '2x2', '1x3', 'single', '1x6_double']);

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/; // E.164

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

  /**
   * Deliver a strip via email or SMS to a guest. Public procedure: the guest
   * is tapping a button in the booth UI; they have no account.
   *
   * Tier gating:
   *   - FREE events have 0 deliveries. Returns FORBIDDEN with TIER_REQUIRED.
   *   - EVENT_PASS: 50 emails + 50 SMS. (Quotas tracked per channel.)
   *   - EVENT_PASS_PLUS: 250 emails + 250 SMS.
   *
   * On a successful send the per-channel counter on the Event row is bumped.
   */
  deliver: publicProcedure
    .input(
      z.object({
        stripId: z.string().min(1),
        channel: z.enum(['email', 'sms']),
        email: z.string().email().optional(),
        phone: z.string().regex(PHONE_REGEX, 'Phone must be in E.164 format.').optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.channel === 'email' && !input.email) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'email is required.' });
      }
      if (input.channel === 'sms' && !input.phone) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'phone is required.' });
      }
      const strip = await ctx.db.strip.findUnique({
        where: { id: input.stripId },
        include: { event: true },
      });
      if (!strip) throw new TRPCError({ code: 'NOT_FOUND', message: 'Strip not found.' });
      if (!strip.event) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Standalone strips cannot be delivered. Use share or save instead.',
        });
      }

      const ent = evaluateEvent({
        id: strip.event.id,
        tier: strip.event.tier,
        endsAt: strip.event.endsAt,
        createdAt: strip.event.createdAt,
        emailDeliveries: strip.event.emailDeliveries,
        smsDeliveries: strip.event.smsDeliveries,
      });
      if (ent.tier === 'FREE') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({ code: 'TIER_REQUIRED', requiredTier: 'EVENT_PASS' }),
        });
      }
      const remaining =
        input.channel === 'email' ? ent.emailDeliveriesRemaining : ent.smsDeliveriesRemaining;
      if (remaining <= 0) {
        throw new TRPCError({
          code: 'RESOURCE_EXHAUSTED',
          message: `Delivery quota exhausted for ${input.channel}.`,
        });
      }

      const stripUrl = strip.igShareUrl ?? strip.photos?.[0]?.url ?? null;
      // The strip's photos are not included in the lookup above (it returned
      // event), so re-load if we still don't have a URL.
      const linkUrl = stripUrl ?? (await firstPhotoUrl(ctx.db, strip.id));
      if (!linkUrl) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'No deliverable URL on this strip yet.',
        });
      }

      if (input.channel === 'email') {
        await sendStripDelivery({
          to: input.email!,
          eventName: strip.event.name,
          stripUrl: linkUrl,
        });
        await ctx.db.event.update({
          where: { id: strip.event.id },
          data: { emailDeliveries: { increment: 1 } },
        });
      } else {
        await sendSms({
          to: input.phone!,
          body: `Your strip from ${strip.event.name}: ${linkUrl}`,
        });
        await ctx.db.event.update({
          where: { id: strip.event.id },
          data: { smsDeliveries: { increment: 1 } },
        });
      }
      return { ok: true, channel: input.channel };
    }),
});

interface DbForFirstPhoto {
  photo: {
    findFirst(args: {
      where: { stripId: string };
      orderBy: { order: 'asc' };
      select: { url: true };
    }): Promise<{ url: string } | null>;
  };
}

async function firstPhotoUrl(
  db: unknown,
  stripId: string,
): Promise<string | null> {
  const typed = db as DbForFirstPhoto;
  const row = await typed.photo.findFirst({
    where: { stripId },
    orderBy: { order: 'asc' },
    select: { url: true },
  });
  return row?.url ?? null;
}
