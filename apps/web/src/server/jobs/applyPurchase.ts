/**
 * Apply a Purchase row to its target Event (or, for Strip Unlock, to its
 * target Strip). Pure server-side function called from:
 *   - the RevenueCat webhook (mobile + web Stripe purchases routed through RC),
 *   - the Stripe webhook (web Stripe purchases recorded directly),
 *   - the tRPC `event.applyPurchase` mutation (manual catch-up).
 *
 * Idempotent: running twice on the same purchase row is a no-op.
 */
import {
  productById,
  productToEventTier,
} from '@tinybooth/billing';

/** Loose Event surface so this module can be unit-tested without Prisma. */
interface EventRow {
  id: string;
  ownerId: string | null;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  endsAt: Date | null;
  retainUntil: Date;
  createdAt: Date;
}

/** Loose Purchase surface. */
interface PurchaseRow {
  id: string;
  userId: string;
  eventId: string | null;
  product: string;
  source: string;
  externalId: string;
  createdAt: Date;
}

/** Loose Strip surface used by the unlock path. */
interface StripRow {
  id: string;
  watermarkRemoved: boolean;
}

/** Minimum Prisma surface this job needs. Both real Prisma and the test mock fit. */
export interface ApplyPurchaseDb {
  purchase: {
    findUnique(args: { where: { id: string } }): Promise<PurchaseRow | null>;
  };
  event: {
    findUnique(args: { where: { id: string } }): Promise<EventRow | null>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<EventRow>;
  };
  strip: {
    findFirst(args: {
      where: Record<string, unknown>;
      orderBy: Record<string, unknown>;
    }): Promise<StripRow | null>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<StripRow>;
  };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Tier-applied result, returned to callers for logging or response payloads. */
export interface ApplyPurchaseResult {
  /** "tier_upgraded", "strip_unlocked", or "noop" (already applied). */
  outcome: 'tier_upgraded' | 'strip_unlocked' | 'noop' | 'unknown_product';
  /** Event id when the apply mutated an event. */
  eventId: string | null;
  /** Strip id when the apply mutated a strip. */
  stripId: string | null;
}

/**
 * Compute the new event endsAt + retainUntil for a paid tier upgrade. If the
 * event has no endsAt yet, default to now + 24 hours (one event window). The
 * retention window is the product's retentionDays added on top of endsAt.
 */
function computeUpgradedDates(
  productId: 'event_pass' | 'event_pass_plus',
  event: EventRow,
  now: Date,
): { endsAt: Date; retainUntil: Date } {
  const product = productById(productId);
  /* c8 ignore next */
  if (!product) throw new Error(`unreachable: ${productId} missing from catalog`);
  const newEndsAt = event.endsAt ?? new Date(now.getTime() + ONE_DAY_MS);
  const retentionDays = product.retentionDays ?? 0;
  const retainUntil = new Date(newEndsAt.getTime() + retentionDays * ONE_DAY_MS);
  return { endsAt: newEndsAt, retainUntil };
}

/**
 * Apply a purchase to its linked event or strip. Idempotent: a no-op if the
 * tier is already at-or-above the requested level (paid tiers) or the strip
 * has already been unlocked.
 *
 * @param db Database surface.
 * @param purchaseId Purchase row id.
 * @param now Override for tests. Defaults to `new Date()`.
 */
export async function applyPurchase(
  db: ApplyPurchaseDb,
  purchaseId: string,
  now: Date = new Date(),
): Promise<ApplyPurchaseResult> {
  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) {
    return { outcome: 'noop', eventId: null, stripId: null };
  }

  // Strip Unlock path: find the most recent unbranded strip and flip the
  // watermark flag. Prefer a strip on the linked event when one is set; fall
  // back to "the user's most recent strip" so the purchase still lands when
  // the unlock is bought from the standalone path.
  if (purchase.product === 'strip_unlock') {
    const where: Record<string, unknown> = { watermarkRemoved: false };
    if (purchase.eventId) where.eventId = purchase.eventId;
    const strip = await db.strip.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });
    if (!strip) return { outcome: 'noop', eventId: purchase.eventId, stripId: null };
    if (strip.watermarkRemoved) {
      return { outcome: 'noop', eventId: purchase.eventId, stripId: strip.id };
    }
    await db.strip.update({
      where: { id: strip.id },
      data: { watermarkRemoved: true },
    });
    return { outcome: 'strip_unlocked', eventId: purchase.eventId, stripId: strip.id };
  }

  // Tier-changing products require an event. Without one we cannot apply.
  const tier = productToEventTier(purchase.product);
  if (!tier) {
    return { outcome: 'unknown_product', eventId: purchase.eventId, stripId: null };
  }
  if (!purchase.eventId) {
    return { outcome: 'noop', eventId: null, stripId: null };
  }
  const event = await db.event.findUnique({ where: { id: purchase.eventId } });
  if (!event) return { outcome: 'noop', eventId: purchase.eventId, stripId: null };
  if (tierAtLeast(event.tier, tier)) {
    return { outcome: 'noop', eventId: event.id, stripId: null };
  }

  const { endsAt, retainUntil } = computeUpgradedDates(
    purchase.product as 'event_pass' | 'event_pass_plus',
    event,
    now,
  );
  await db.event.update({
    where: { id: event.id },
    data: { tier, endsAt, retainUntil },
  });
  return { outcome: 'tier_upgraded', eventId: event.id, stripId: null };
}

/** True when `current` is the same as or above `required` on the event tier ladder. */
function tierAtLeast(
  current: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS',
  required: 'EVENT_PASS' | 'EVENT_PASS_PLUS',
): boolean {
  const order: Record<string, number> = {
    FREE: 0,
    EVENT_PASS: 1,
    EVENT_PASS_PLUS: 2,
  };
  const c = order[current] ?? 0;
  const r = order[required] ?? 0;
  return c >= r;
}

/**
 * Revoke a previously-applied paid Event Pass / Event Pass Plus purchase. Used
 * by the RevenueCat webhook on CANCELLATION and EXPIRATION events. Reverts
 * the event tier to FREE and shortens retention to the free-tier window
 * (createdAt + 7 days), but never below 24 hours from now so a host's photos
 * do not vanish mid-event.
 *
 * @param db Database surface.
 * @param purchaseId Purchase row id.
 * @param now Override for tests.
 */
export async function revokePurchase(
  db: ApplyPurchaseDb,
  purchaseId: string,
  now: Date = new Date(),
): Promise<ApplyPurchaseResult> {
  const purchase = await db.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) return { outcome: 'noop', eventId: null, stripId: null };
  if (!productToEventTier(purchase.product)) {
    // Strip Unlock and unknown products do not revoke (Strip Unlock is one-shot).
    return { outcome: 'noop', eventId: purchase.eventId, stripId: null };
  }
  if (!purchase.eventId) return { outcome: 'noop', eventId: null, stripId: null };
  const event = await db.event.findUnique({ where: { id: purchase.eventId } });
  if (!event) return { outcome: 'noop', eventId: purchase.eventId, stripId: null };

  const FREE_RETENTION_DAYS = 7;
  const minRetain = new Date(now.getTime() + ONE_DAY_MS);
  const fromCreated = new Date(event.createdAt.getTime() + FREE_RETENTION_DAYS * ONE_DAY_MS);
  const retainUntil = fromCreated.getTime() < minRetain.getTime() ? minRetain : fromCreated;
  await db.event.update({
    where: { id: event.id },
    data: { tier: 'FREE', retainUntil },
  });
  return { outcome: 'tier_upgraded', eventId: event.id, stripId: null };
}
