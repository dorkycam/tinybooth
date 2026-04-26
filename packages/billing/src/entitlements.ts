/**
 * Pure entitlement evaluation. Given an Event row + the Purchases applied to
 * it, return the active feature set. Used server-side (router gating) and on
 * the dashboard (paywall copy + delivery counters).
 *
 * Free tier defaults come from `docs/plan.md` section 2 ("Free tier limits").
 * Paid limits come from the Product catalog so the two stay in lock-step.
 */
import { EVENT_PASS, EVENT_PASS_PLUS } from './products';

/** EventTier mirrors the Prisma enum. Repeated here so this package stays Prisma-free. */
export type EventTier = 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';

/** Active entitlement keys the server might check. */
export type Entitlement =
  | 'watermark_removed'
  | 'custom_branding'
  | 'logo_upload'
  | 'dashboard_export'
  | 'video_upload'
  | 'custom_messages'
  | 'email_delivery'
  | 'sms_delivery';

/** Free-tier guest cap. Beats Kululu's 50 per docs/research/competitors.md. */
export const FREE_TIER_GUEST_CAP = 100;
/** Free-tier retention window (days). */
export const FREE_TIER_RETENTION_DAYS = 7;

/** Minimum Event row shape the evaluator needs. */
export interface EventInput {
  id: string;
  tier: EventTier;
  /** When the event ends accepting uploads. Used by the duration math. */
  endsAt: Date | null;
  /** When the event was created. Free tier retention is measured from here. */
  createdAt: Date;
  /** Per-event email delivery counter. Bumped by the delivery code path. */
  emailDeliveries: number;
  /** Per-event SMS delivery counter. */
  smsDeliveries: number;
}

/** Minimum Purchase row shape the evaluator needs. */
export interface PurchaseInput {
  id: string;
  product: string;
  createdAt: Date;
  /** When the purchase was refunded or expired. Null when still active. */
  revokedAt?: Date | null;
}

/** Result returned by `evaluateEvent`. All counters are derived, not stored. */
export interface EventEntitlements {
  /** Effective tier after applying purchases (kept in sync with Event.tier). */
  tier: EventTier;
  /** Whether the watermark is removed from strips for this event. */
  watermarkRemoved: boolean;
  /** Whether the host can use custom logo + colors. */
  customBranding: boolean;
  /** Whether the host can upload a logo image (paid only). */
  logoUploadAllowed: boolean;
  /** Whether the dashboard bulk export is available. */
  dashboardExportAllowed: boolean;
  /** Whether video uploads are accepted. */
  videoUploadsAllowed: boolean;
  /** Whether the host can add custom random messages. */
  customMessagesAllowed: boolean;
  /** Days of retention granted to this event. */
  retentionDays: number;
  /** Hard cap on TinyWall guest uploads. Null means unlimited. */
  guestCap: number | null;
  /** Total email delivery quota for this event. */
  emailQuota: number;
  /** Total SMS delivery quota for this event. */
  smsQuota: number;
  /** Email deliveries remaining (quota minus consumed). Never negative. */
  emailDeliveriesRemaining: number;
  /** SMS deliveries remaining (quota minus consumed). Never negative. */
  smsDeliveriesRemaining: number;
}

/** Defaults applied when no paid purchase is active. */
const FREE_DEFAULTS: Omit<EventEntitlements, 'emailDeliveriesRemaining' | 'smsDeliveriesRemaining' | 'tier'> = {
  watermarkRemoved: false,
  customBranding: false,
  logoUploadAllowed: false,
  dashboardExportAllowed: false,
  videoUploadsAllowed: false,
  customMessagesAllowed: false,
  retentionDays: FREE_TIER_RETENTION_DAYS,
  guestCap: FREE_TIER_GUEST_CAP,
  emailQuota: 0,
  smsQuota: 0,
};

/**
 * Pick the highest-tier active purchase from the list. Active means
 * non-revoked. Order: EVENT_PASS_PLUS > EVENT_PASS > anything else.
 */
function highestActiveTierProduct(
  purchases: readonly PurchaseInput[],
): 'event_pass_plus' | 'event_pass' | null {
  let best: 'event_pass_plus' | 'event_pass' | null = null;
  for (const p of purchases) {
    if (p.revokedAt) continue;
    if (p.product === 'event_pass_plus') return 'event_pass_plus';
    if (p.product === 'event_pass' && best === null) best = 'event_pass';
  }
  return best;
}

/**
 * Resolve the active entitlements for an event. Treats Event.tier as the
 * source of truth when no purchases are passed (so cron jobs and read-only
 * paths can call this without joining purchases). When purchases are passed,
 * the highest active product wins, which matches what the apply-purchase
 * server logic does.
 *
 * @param event Event row.
 * @param purchases Purchases tied to this event (may be empty).
 */
export function evaluateEvent(
  event: EventInput,
  purchases: readonly PurchaseInput[] = [],
): EventEntitlements {
  // Decide effective tier.
  const fromPurchase = highestActiveTierProduct(purchases);
  let tier: EventTier;
  if (fromPurchase === 'event_pass_plus') tier = 'EVENT_PASS_PLUS';
  else if (fromPurchase === 'event_pass') tier = 'EVENT_PASS';
  else tier = event.tier;

  // FREE: stock defaults plus the live counter math.
  if (tier === 'FREE') {
    return {
      tier: 'FREE',
      ...FREE_DEFAULTS,
      emailDeliveriesRemaining: 0,
      smsDeliveriesRemaining: 0,
    };
  }

  // Paid tier: derive the rest of the catalog row. Both paid products carry a
  // non-null retentionDays, so we assert that invariant here rather than
  // smuggling a runtime fallback past the type system.
  const product = tier === 'EVENT_PASS_PLUS' ? EVENT_PASS_PLUS : EVENT_PASS;
  const retentionDays = product.retentionDays;
  /* c8 ignore next 3 */
  if (retentionDays === null) {
    throw new Error(`Paid product ${product.id} is missing retentionDays.`);
  }
  const emailQuota = product.deliveryQuota;
  const smsQuota = product.deliveryQuota;
  return {
    tier,
    watermarkRemoved: true,
    customBranding: true,
    logoUploadAllowed: true,
    dashboardExportAllowed: true,
    videoUploadsAllowed: true,
    customMessagesAllowed: product.customMessagesAllowed,
    retentionDays,
    guestCap: product.guestCap,
    emailQuota,
    smsQuota,
    emailDeliveriesRemaining: Math.max(0, emailQuota - event.emailDeliveries),
    smsDeliveriesRemaining: Math.max(0, smsQuota - event.smsDeliveries),
  };
}

/**
 * True when the event can accept another guest upload now. The caller still
 * has to enforce the result; this is just the math.
 *
 * @param event Event input.
 * @param currentGuestUploadCount Total uploads already accepted.
 * @param purchases Purchases applied to the event.
 */
export function canAcceptGuestUpload(
  event: EventInput,
  currentGuestUploadCount: number,
  purchases: readonly PurchaseInput[] = [],
): boolean {
  const e = evaluateEvent(event, purchases);
  if (e.guestCap === null) return true;
  return currentGuestUploadCount < e.guestCap;
}

/**
 * True when the event has at least one delivery slot left for the channel.
 *
 * @param event Event input.
 * @param channel `email` or `sms`.
 * @param purchases Purchases applied to the event.
 */
export function canDeliver(
  event: EventInput,
  channel: 'email' | 'sms',
  purchases: readonly PurchaseInput[] = [],
): boolean {
  const e = evaluateEvent(event, purchases);
  return channel === 'email' ? e.emailDeliveriesRemaining > 0 : e.smsDeliveriesRemaining > 0;
}
