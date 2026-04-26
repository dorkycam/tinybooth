/**
 * Dashboard router. Owner-only reads + the bulk-export kickoff that hands off
 * to a background job (`apps/web/src/server/jobs/exportEvent.ts`).
 */
import { createHmac, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { evaluateEvent } from '@tinybooth/billing';
import { router, protectedProcedure } from '../trpc';
import { runExportJob, type ExportJobDb } from '../../jobs/exportEvent';
import { getStorage } from '../../../lib/storage';

const PHOTO_PAGE_SIZE = 60;

export const dashboardRouter = router({
  /** List events owned by the calling user. */
  events: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.event.findMany({
      where: { ownerId: ctx.userId },
      orderBy: { createdAt: 'desc' },
    });
  }),

  /**
   * Single event by id, owner only. Convenience wrapper for the dashboard
   * detail pages so they don't need to filter the events() list client-side.
   */
  eventById: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      return event;
    }),

  /**
   * Stats for the overview tab: counts of posts/photos/strips, retention
   * countdown in days, and current delivery usage. All from a single event row
   * plus three cheap counts.
   */
  eventStats: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const [posts, strips, photos] = await Promise.all([
        ctx.db.post.count({ where: { eventId: input.eventId } }),
        ctx.db.strip.count({ where: { eventId: input.eventId } }),
        ctx.db.photo.count({
          where: {
            OR: [
              { post: { eventId: input.eventId } },
              { strip: { eventId: input.eventId } },
            ],
          },
        }),
      ]);
      const msPerDay = 24 * 60 * 60 * 1000;
      const retentionDaysRemaining = Math.max(
        0,
        Math.ceil((event.retainUntil.getTime() - Date.now()) / msPerDay),
      );
      return {
        posts,
        strips,
        photos,
        retentionDaysRemaining,
        emailDeliveries: event.emailDeliveries,
        smsDeliveries: event.smsDeliveries,
        tier: event.tier,
      };
    }),

  /**
   * Combined paginated photo feed. Returns posts (TinyWall) and strips
   * (TinyBooth) for an event in newest-first order. Owner only.
   */
  eventPhotos: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        cursor: z.string().min(1).optional(),
        pageSize: z.number().int().min(1).max(200).default(PHOTO_PAGE_SIZE),
      }),
    )
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const cursorDate = input.cursor ? new Date(input.cursor) : undefined;
      const [posts, strips] = await Promise.all([
        ctx.db.post.findMany({
          where: {
            eventId: input.eventId,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
          },
          include: { photos: { orderBy: { order: 'asc' } } },
          orderBy: { createdAt: 'desc' },
          take: input.pageSize,
        }),
        ctx.db.strip.findMany({
          where: {
            eventId: input.eventId,
            ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
          },
          include: { photos: { orderBy: { order: 'asc' } } },
          orderBy: { createdAt: 'desc' },
          take: input.pageSize,
        }),
      ]);
      const merged = [
        ...posts.map((p) => ({ kind: 'post' as const, id: p.id, createdAt: p.createdAt, photos: p.photos })),
        ...strips.map((s) => ({ kind: 'strip' as const, id: s.id, createdAt: s.createdAt, photos: s.photos })),
      ]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, input.pageSize);
      const nextCursor = merged.length === input.pageSize
        ? merged[merged.length - 1]?.createdAt.toISOString() ?? null
        : null;
      return { items: merged, nextCursor };
    }),

  /**
   * Kick off a bulk export for an event. Inserts an Export row in PENDING,
   * then schedules the build asynchronously so the HTTP response returns
   * fast. Behind EVENT_PASS or EVENT_PASS_PLUS tier.
   */
  exportEvent: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const ent = evaluateEvent({
        id: event.id,
        tier: event.tier,
        endsAt: event.endsAt,
        createdAt: event.createdAt,
        emailDeliveries: event.emailDeliveries,
        smsDeliveries: event.smsDeliveries,
      });
      if (!ent.dashboardExportAllowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: JSON.stringify({ code: 'TIER_REQUIRED', requiredTier: 'EVENT_PASS' }),
        });
      }
      const exp = await ctx.db.export.create({
        data: { eventId: input.eventId, userId: ctx.userId, status: 'PENDING' },
      });
      // Fire-and-forget; the job updates the row when it finishes. We swallow
      // errors here so the kickoff response never blocks on the build.
      // PrismaClient satisfies the loose ExportJobDb shape but the strict
      // generic types differ; cast at the boundary.
      void runExportJob({
        db: ctx.db as unknown as ExportJobDb,
        storage: getStorage(),
        exportId: exp.id,
        eventId: input.eventId,
        userEmail: ctx.userEmail ?? null,
      }).catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('[exportEvent] background job failed:', err);
      });
      return { exportId: exp.id, status: exp.status };
    }),

  /**
   * Issue a short-lived pairing code for the mobile booth's QR scan flow.
   * The code is an HMAC of `eventId|nonce|expiresAt` keyed by `PAIRING_SECRET`
   * (or a per-process random fallback when the env is missing). The mobile
   * app POSTs eventId + code back via `event.bySlug`-equivalent flow; the
   * pairing payload format is documented in `apps/mobile/src/lib/eventConnection.ts`.
   *
   * TTL: 10 minutes. The code is stateless (no DB write) so refreshing is
   * cheap.
   */
  pairingCode: protectedProcedure
    .input(z.object({ eventId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const nonce = randomBytes(8).toString('hex');
      const payloadParts = [input.eventId, nonce, expiresAt.toISOString()];
      const secret = process.env.PAIRING_SECRET ?? 'tinybooth-dev-fallback-secret';
      const hmac = createHmac('sha256', secret).update(payloadParts.join('|')).digest('hex');
      const code = `${nonce}.${hmac.slice(0, 16)}`;
      const url = `tinybooth://event?id=${encodeURIComponent(input.eventId)}&code=${encodeURIComponent(code)}`;
      return { code, url, expiresAt };
    }),

  /** Poll an export's status. Owner only. */
  exportStatus: protectedProcedure
    .input(z.object({ exportId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const exp = await ctx.db.export.findUnique({ where: { id: input.exportId } });
      if (!exp) throw new TRPCError({ code: 'NOT_FOUND' });
      if (exp.userId !== ctx.userId) throw new TRPCError({ code: 'FORBIDDEN' });
      return {
        id: exp.id,
        status: exp.status,
        signedUrl: exp.signedUrl,
        expiresAt: exp.expiresAt,
        errorMsg: exp.errorMsg,
        createdAt: exp.createdAt,
        completedAt: exp.completedAt,
      };
    }),
});
