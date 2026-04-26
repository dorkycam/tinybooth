/**
 * POST /api/webhooks/stripe
 *
 * Verifies the Stripe signature, handles `checkout.session.completed`, and
 * fulfills the purchase by inserting a Purchase row directly + calling
 * applyPurchase.
 *
 * Why direct insert instead of round-tripping through RevenueCat: simpler.
 * RevenueCat Web Billing exists, but the only thing we'd gain is unified
 * analytics. We already have one canonical Purchase table on our side; bridging
 * to RC for web purchases would mean a second source of truth + a second auth
 * flow. The trade-off is documented in `docs/research/monetization.md` section
 * 5.1 (RC's pros are mostly receipt validation on iOS, which web does not need).
 *
 * Idempotency: Purchase has @@unique([source, externalId]). The Stripe session
 * id is the externalId so replays insert nothing extra.
 */
import { NextRequest, NextResponse } from 'next/server';
import { productById } from '@tinybooth/billing';
import { db } from '../../../../src/lib/db';
import { verifyAndParseWebhook, type CheckoutSessionRecord } from '../../../../src/lib/stripe';
import {
  applyPurchase,
  type ApplyPurchaseDb,
} from '../../../../src/server/jobs/applyPurchase';

interface StripeCheckoutSessionObject {
  id: string;
  amount_total: number | null;
  currency: string | null;
  metadata: Record<string, string> | null;
  customer_email: string | null;
  payment_status: string;
}

/** Structured log helper. */
function log(payload: Record<string, unknown>): void {
  // eslint-disable-next-line no-console
  console.info(JSON.stringify({ src: 'stripe-webhook', ...payload }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? null;
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();
  const event = await verifyAndParseWebhook(rawBody, signature, secret);
  if (!event) {
    log({ outcome: 'rejected', reason: 'bad_signature' });
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  if (event.type !== 'checkout.session.completed') {
    log({ outcome: 'ignored', type: event.type });
    return NextResponse.json({ ignored: true, type: event.type });
  }

  const session = event.data.object as StripeCheckoutSessionObject;
  const meta = session.metadata ?? {};
  const productId = meta.productId;
  const eventId = meta.eventId;
  const userId = meta.userId;
  if (!productId || !eventId || !userId) {
    log({ outcome: 'rejected', reason: 'missing_metadata', txId: session.id });
    return NextResponse.json({ error: 'Missing metadata.' }, { status: 400 });
  }
  const product = productById(productId);
  if (!product) {
    log({ outcome: 'rejected', reason: 'unknown_product', productId });
    return NextResponse.json({ error: 'Unknown product.' }, { status: 400 });
  }
  if (session.payment_status !== 'paid') {
    log({ outcome: 'ignored', reason: 'unpaid', txId: session.id });
    return NextResponse.json({ ignored: true, reason: 'unpaid' });
  }

  const purchase = await db.purchase.upsert({
    where: { source_externalId: { source: 'web_stripe', externalId: session.id } },
    update: {},
    create: {
      userId,
      eventId,
      product: product.id,
      source: 'web_stripe',
      externalId: session.id,
      amountCents: session.amount_total ?? product.priceUsdCents.web,
      currency: (session.currency ?? 'usd').toUpperCase(),
    },
  });
  const result = await applyPurchase(db as unknown as ApplyPurchaseDb, purchase.id);
  log({
    outcome: result.outcome,
    type: event.type,
    txId: session.id,
    product: product.id,
    eventId: result.eventId,
  });
  return NextResponse.json({ ok: true, purchaseId: purchase.id, outcome: result.outcome });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Re-exported for the test file to import without dragging in the stripe SDK. */
export type { CheckoutSessionRecord };
