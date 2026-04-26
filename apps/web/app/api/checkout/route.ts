/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for a single product applied to a single
 * event. The dashboard paywall posts here; we redirect the browser to the
 * returned `url` (real Stripe in prod, the local stub URL in dev).
 *
 * Body:  { eventId: string, productId: 'event_pass' | 'event_pass_plus' }
 * Auth:  shared `@tinybooth/auth` resolver. Owner-only on the event.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@tinybooth/auth';
import { productById } from '@tinybooth/billing';
import { db } from '../../../src/lib/db';
import { createCheckoutSession } from '../../../src/lib/stripe';

interface CheckoutBody {
  eventId?: string;
  productId?: string;
}

/** Build the absolute success / cancel URLs from the request origin. */
function origin(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_WEB_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv.replace(/\/$/, '');
  const protoHeader = req.headers.get('x-forwarded-proto');
  const hostHeader = req.headers.get('host');
  const proto = protoHeader ?? 'https';
  const host = hostHeader ?? 'tinybooth.com';
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req.headers);
  if (!session) {
    return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  }
  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.eventId || !body.productId) {
    return NextResponse.json(
      { error: 'eventId and productId are required.' },
      { status: 400 },
    );
  }
  const product = productById(body.productId);
  if (!product) {
    return NextResponse.json({ error: 'Unknown product.' }, { status: 400 });
  }
  if (!product.webStripeProductId) {
    return NextResponse.json(
      { error: 'This product is not sold on the web.' },
      { status: 400 },
    );
  }
  const event = await db.event.findUnique({ where: { id: body.eventId } });
  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }
  if (event.ownerId && event.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  const base = origin(req);
  const successUrl = `${base}/dashboard/events/${event.id}?purchase=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${base}/dashboard/events/${event.id}?purchase=cancelled`;
  const checkout = await createCheckoutSession({
    productId: product.id,
    amountUsdCents: product.priceUsdCents.web,
    productName: product.name,
    productDescription: product.description,
    successUrl,
    cancelUrl,
    metadata: {
      eventId: event.id,
      productId: product.id,
      userId: session.userId,
    },
    customerEmail: session.user.email ?? null,
  });
  return NextResponse.json({ id: checkout.id, url: checkout.url });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
