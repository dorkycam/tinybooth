/**
 * POST /api/webhooks/revenuecat
 *
 * Verifies the shared-secret signature, upserts a Purchase row idempotently,
 * then applies the purchase to the target Event (raises tier + extends
 * retention). Idempotent via Purchase.unique([source, externalId]).
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/lib/db';
import { mapProductToTier, computeRetainUntil } from '../../../../src/server/api/routers/event';

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

/** Map RevenueCat store id to our Purchase.source string. */
function mapSource(store: string): string {
  if (store === 'APP_STORE') return 'ios_iap';
  if (store === 'PLAY_STORE') return 'android_iap';
  if (store === 'STRIPE') return 'web_stripe';
  return store.toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured.' },
      { status: 503 },
    );
  }
  const signature = req.headers.get('authorization');
  if (!signature || signature !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
  }

  let body: RevenueCatBody;
  try {
    body = (await req.json()) as RevenueCatBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const ev = body.event;
  if (!ev || !ev.type || !ev.transaction_id || !ev.product_id || !ev.app_user_id) {
    return NextResponse.json({ error: 'Malformed event.' }, { status: 400 });
  }

  // We only act on initial purchase + renewal events. Refunds are out of
  // scope until Phase 4 wires the dispute path.
  if (ev.type !== 'INITIAL_PURCHASE' && ev.type !== 'NON_RENEWING_PURCHASE' && ev.type !== 'RENEWAL') {
    return NextResponse.json({ ignored: true, type: ev.type });
  }

  const source = mapSource(ev.store);
  const eventIdMeta = (ev.metadata as { eventId?: string } | undefined)?.eventId;

  // Upsert the Purchase row idempotently on the (source, externalId) unique.
  const purchase = await db.purchase.upsert({
    where: { source_externalId: { source, externalId: ev.transaction_id } },
    update: {},
    create: {
      userId: ev.app_user_id,
      eventId: eventIdMeta ?? null,
      product: ev.product_id,
      source,
      externalId: ev.transaction_id,
      amountCents: Math.round((ev.price_in_purchased_currency ?? 0) * 100),
      currency: ev.currency ?? 'USD',
    },
  });

  // If this purchase grants a tier and we know the event, apply it now.
  const tier = mapProductToTier(ev.product_id);
  if (tier && eventIdMeta) {
    const event = await db.event.findUnique({ where: { id: eventIdMeta } });
    if (event) {
      await db.event.update({
        where: { id: eventIdMeta },
        data: {
          tier,
          retainUntil: computeRetainUntil(tier, event.endsAt),
        },
      });
    }
  }

  return NextResponse.json({ ok: true, purchaseId: purchase.id });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
