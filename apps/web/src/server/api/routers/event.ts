/**
 * Event router. Handles create/read/update/delete plus the cross-product
 * `applyPurchase` action that bumps an event's tier and retention window.
 */
import { randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { generateSlug } from '../../../lib/slug';
import { clean } from '../../../lib/profanity';
import { applyPurchase, type ApplyPurchaseDb } from '../../jobs/applyPurchase';

const FREE_RETENTION_DAYS = 7;
const EVENT_PASS_RETENTION_DAYS = 60;
const EVENT_PASS_PLUS_RETENTION_DAYS = 90;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const TierEnum = z.enum(['FREE', 'EVENT_PASS', 'EVENT_PASS_PLUS']);

const BrandingSchema = z
  .object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    accentColor: z.string().optional(),
  })
  .partial();

const SettingsSchema = z.record(z.unknown());

/**
 * Compute retainUntil based on tier + endsAt. Free events get a fixed 7-day
 * window from now (matches the cron cleanup spec).
 */
function computeRetainUntil(tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS', endsAt: Date | null): Date {
  const base = endsAt ?? new Date();
  switch (tier) {
    case 'FREE':
      return new Date(Date.now() + FREE_RETENTION_DAYS * ONE_DAY_MS);
    case 'EVENT_PASS':
      return new Date(base.getTime() + EVENT_PASS_RETENTION_DAYS * ONE_DAY_MS);
    case 'EVENT_PASS_PLUS':
      return new Date(base.getTime() + EVENT_PASS_PLUS_RETENTION_DAYS * ONE_DAY_MS);
  }
}

export const eventRouter = router({
  /**
   * Create an event. Anonymous callers get an event with `ownerId = null`
   * and a `claimToken` returned alongside the event so they can claim it
   * later by signing in. Authed callers become the owner immediately and
   * receive `claimToken: null`.
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(120),
        settings: SettingsSchema.optional(),
        branding: BrandingSchema.optional(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cleanedName = clean(input.name);
      if (cleanedName.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Event name is required.' });
      }
      const slug = generateSlug(cleanedName);
      const claimToken = ctx.userId ? null : generateClaimToken();
      const event = await ctx.db.event.create({
        data: {
          name: cleanedName,
          slug,
          ownerId: ctx.userId,
          tier: 'FREE',
          retainUntil: computeRetainUntil('FREE', null),
          branding: (input.branding ?? {}) as object,
          settings: (input.settings ?? {}) as object,
          startsAt: input.startsAt ?? null,
          endsAt: input.endsAt ?? null,
          claimToken,
        },
      });
      return { ...event, claimToken };
    }),

  /**
   * Claim ownership of an anonymous event using the one-time claim token
   * issued at creation time. Single-use; after a successful claim the token
   * is cleared so it cannot be replayed.
   */
  claim: protectedProcedure
    .input(z.object({ eventId: z.string().min(1), claimToken: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.ownerId) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Event is already owned.' });
      }
      if (!event.claimToken || event.claimToken !== input.claimToken) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid claim token.' });
      }
      const updated = await ctx.db.event.update({
        where: { id: input.eventId },
        data: { ownerId: ctx.userId, claimToken: null, claimedAt: new Date() },
      });
      return updated;
    }),

  /**
   * Public lookup by slug. Used by the wall TV display and guest upload flow.
   */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({ where: { slug: input.slug } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      return event;
    }),

  /**
   * Owner-only update. Phase 1 enforces ownerId match; Phase 3 swaps in the
   * Supabase RLS policy.
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(120).optional(),
        branding: BrandingSchema.optional(),
        settings: SettingsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.ownerId && existing.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = clean(input.name);
      if (input.branding !== undefined) data.branding = input.branding;
      if (input.settings !== undefined) data.settings = input.settings;
      const updated = await ctx.db.event.update({ where: { id: input.id }, data });
      return updated;
    }),

  /**
   * Apply a paid Purchase to an Event: bumps the tier and recomputes
   * retainUntil. Idempotent: if the event is already at-or-above the requested
   * tier, the call is a no-op. Delegates the actual mutation to
   * `applyPurchase` so the same code path runs from webhooks.
   */
  applyPurchase: protectedProcedure
    .input(
      z.object({
        eventId: z.string().min(1),
        purchaseId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const purchase = await ctx.db.purchase.findUnique({ where: { id: input.purchaseId } });
      if (!purchase) throw new TRPCError({ code: 'NOT_FOUND', message: 'Purchase not found.' });
      const event = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found.' });
      if (event.ownerId && event.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      // Delegate to the shared applier so webhooks + manual catch-up agree.
      // Cast at the boundary since the prisma client carries stricter generics
      // than the loose ApplyPurchaseDb shape needs.
      await applyPurchase(
        ctx.db as unknown as ApplyPurchaseDb,
        purchase.id,
      );
      const updated = await ctx.db.event.findUnique({ where: { id: input.eventId } });
      return updated ?? event;
    }),

  /** Owner-only delete. Cascades to posts/photos/strips via Prisma relations. */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.event.findUnique({ where: { id: input.id } });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.ownerId && existing.ownerId !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      await ctx.db.event.delete({ where: { id: input.id } });
      return { ok: true } as const;
    }),
});

/**
 * Map a RevenueCat product id to an EventTier. Returns null for non-tier
 * products (e.g. strip_unlock).
 */
export function mapProductToTier(
  product: string,
): 'EVENT_PASS' | 'EVENT_PASS_PLUS' | null {
  if (product === 'event_pass') return 'EVENT_PASS';
  if (product === 'event_pass_plus') return 'EVENT_PASS_PLUS';
  return null;
}

/**
 * Generate a URL-safe one-time claim token for anonymous event creation.
 * 24 random bytes hex-encoded gives 48 chars of entropy.
 */
export function generateClaimToken(): string {
  return randomBytes(24).toString('hex');
}

export { computeRetainUntil, TierEnum };
