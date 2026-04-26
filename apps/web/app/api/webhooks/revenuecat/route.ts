/**
 * POST /api/webhooks/revenuecat
 *
 * Handles every RevenueCat event we care about:
 *   - INITIAL_PURCHASE, RENEWAL, NON_RENEWING_PURCHASE, PRODUCT_CHANGE: upsert
 *     a Purchase row, then call applyPurchase to bump the event tier or unlock
 *     the strip.
 *   - CANCELLATION, EXPIRATION: call revokePurchase to drop the event back to
 *     FREE with the retention guardrails from docs/plan.md section 4.I.
 *   - BILLING_ISSUE: log only (no entitlement change yet; RC retries).
 *
 * Auth: RevenueCat lets you pick "Authorization header" verification. We
 * accept either `Authorization: Bearer <secret>` (the simple shared-secret
 * mode) or `X-RevenueCat-Signature: sha256=<hex>` (HMAC-SHA256 of the raw
 * body keyed by REVENUECAT_WEBHOOK_SECRET). Either path satisfies the
 * documented configuration.
 *
 * Idempotency: the Purchase model has @@unique([source, externalId]) so the
 * upsert silently de-dupes replays. The downstream applyPurchase call is also
 * idempotent (it no-ops when the event tier is already at-or-above).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/lib/db';
import {
  applyPurchase,
  revokePurchase,
  type ApplyPurchaseDb,
} from '../../../../src/server/jobs/applyPurchase';

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  product_id: string;
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | string;
  transaction_id: string;
  price_in_purchased_currency?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

interface RevenueCatBody {
  event: RevenueCatEvent;
}

/** RC store id -> our Purchase.source canonical value. */
function mapSource(store: string): string {
  if (store === 'APP_STORE') return 'ios_iap';
  if (store === 'PLAY_STORE') return 'android_iap';
  if (store === 'STRIPE') return 'web_stripe';
  return store.toLowerCase();
}

const APPLY_TYPES = new Set([
  'INITIAL_PURCHASE',
  'NON_RENEWING_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
]);
const REVOKE_TYPES = new Set(['CANCELLATION', 'EXPIRATION']);
const LOG_ONLY_TYPES = new Set(['BILLING_ISSUE']);

/** Structured log helper. JSON for Vercel/CloudWatch. No PII. */
function log(payload: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.info(JSON.stringify({ src: 'revenuecat-webhook', ...payload }));
}

/**
 * Verify either an `Authorization: Bearer <secret>` header or an HMAC-SHA256
 * signature header. Returns true when the request is authentic.
 */
function verifySignature(
  authHeader: string | null,
  signatureHeader: string | null,
  rawBody: string,
  secret: string,
): boolean {
  if (authHeader && authHeader === `Bearer ${secret}`) return true;
  if (!signatureHeader) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '').trim();
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured.' },
      { status: 503 },
    );
  }
  const authHeader = req.headers.get('authorization');
  const sigHeader = req.headers.get('x-revenuecat-signature');
  const rawBody = await req.text();
  if (!verifySignature(authHeader, sigHeader, rawBody, secret)) {
    log({ outcome: 'rejected', reason: 'bad_signature' });
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let body: RevenueCatBody;
  try {
    body = JSON.parse(rawBody) as RevenueCatBody;
  } catch {
    log({ outcome: 'rejected', reason: 'bad_json' });
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const ev = body.event;
  if (!ev || !ev.type || !ev.transaction_id || !ev.product_id || !ev.app_user_id) {
    log({ outcome: 'rejected', reason: 'missing_fields' });
    return NextResponse.json({ error: 'Malformed event.' }, { status: 400 });
  }

  if (LOG_ONLY_TYPES.has(ev.type)) {
    log({ outcome: 'logged', type: ev.type, txId: ev.transaction_id });
    return NextResponse.json({ ok: true, type: ev.type });
  }

  if (!APPLY_TYPES.has(ev.type) && !REVOKE_TYPES.has(ev.type)) {
    log({ outcome: 'ignored', type: ev.type, txId: ev.transaction_id });
    return NextResponse.json({ ignored: true, type: ev.type });
  }

  const source = mapSource(ev.store);
  const eventIdMeta = (ev.metadata as { eventId?: string } | undefined)?.eventId ?? null;

  // Always upsert the Purchase row first so replays + revocations have
  // something to reference. Idempotent on (source, externalId).
  const purchase = await db.purchase.upsert({
    where: { source_externalId: { source, externalId: ev.transaction_id } },
    update: {},
    create: {
      userId: ev.app_user_id,
      eventId: eventIdMeta,
      product: ev.product_id,
      source,
      externalId: ev.transaction_id,
      amountCents: Math.round((ev.price_in_purchased_currency ?? 0) * 100),
      currency: ev.currency ?? 'USD',
    },
  });

  if (APPLY_TYPES.has(ev.type)) {
    const result = await applyPurchase(db as unknown as ApplyPurchaseDb, purchase.id);
    log({
      outcome: result.outcome,
      type: ev.type,
      txId: ev.transaction_id,
      product: ev.product_id,
      eventId: result.eventId,
      stripId: result.stripId,
    });
    return NextResponse.json({ ok: true, purchaseId: purchase.id, outcome: result.outcome });
  }

  // REVOKE_TYPES path.
  const revoked = await revokePurchase(db as unknown as ApplyPurchaseDb, purchase.id);
  log({
    outcome: `revoke:${revoked.outcome}`,
    type: ev.type,
    txId: ev.transaction_id,
    product: ev.product_id,
    eventId: revoked.eventId,
  });
  return NextResponse.json({ ok: true, purchaseId: purchase.id, revoked: revoked.outcome });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
