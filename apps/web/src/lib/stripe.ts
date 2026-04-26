/**
 * Stripe SDK wrapper. Two modes:
 *
 *   - Production / staging: STRIPE_SECRET_KEY is set, lazy-imports `stripe`,
 *     creates Checkout Sessions, verifies webhook signatures.
 *   - Local dev: STRIPE_SECRET_KEY is missing. The wrapper returns a stub
 *     Checkout Session whose id starts with `cs_test_local_` and whose URL
 *     points back at the success URL with `?session_id=<the-stub-id>`. The
 *     stub session is recorded in-memory and returned by `retrieveSession()`
 *     marked as "paid" so the rest of the post-purchase pipeline runs end to
 *     end without provisioning a Stripe account.
 *
 * The lazy import keeps the `stripe` SDK out of the offline test path.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { randomBytes } from 'node:crypto';

/** Inputs for `createCheckoutSession`. */
export interface CreateCheckoutSessionInput {
  productId: string;
  amountUsdCents: number;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
  /** Metadata stamped on the session (eventId, userId, productId). */
  metadata: Record<string, string>;
  /** Customer email (host's email). Optional. */
  customerEmail?: string | null;
}

/** Slim Checkout Session shape we return to callers. */
export interface CheckoutSessionRecord {
  id: string;
  url: string;
  amountTotal: number;
  currency: string;
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  metadata: Record<string, string>;
  customerEmail: string | null;
}

/** In-memory store for stub sessions during local dev / tests. */
const stubStore = new Map<string, CheckoutSessionRecord>();

/** Reset helper for tests. */
export function __resetStripeStubForTests(): void {
  stubStore.clear();
}

/**
 * True when STRIPE_SECRET_KEY is present. Callers can branch on this without
 * pulling in the SDK module.
 */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Checkout Session. Behind the scenes either calls Stripe's API or
 * returns the local stub.
 *
 * @param input Session inputs.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CheckoutSessionRecord> {
  if (!stripeConfigured()) return createStubSession(input);
  const stripe = await loadStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: input.amountUsdCents,
          product_data: {
            name: input.productName,
            description: input.productDescription,
          },
        },
      },
    ],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: input.metadata,
    customer_email: input.customerEmail ?? undefined,
  });
  return mapStripeSession(session);
}

/**
 * Retrieve an existing session by id. Returns null on miss.
 *
 * @param sessionId Stripe session id.
 */
export async function retrieveSession(
  sessionId: string,
): Promise<CheckoutSessionRecord | null> {
  if (!stripeConfigured()) return stubStore.get(sessionId) ?? null;
  const stripe = await loadStripe();
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return mapStripeSession(session);
  } catch {
    return null;
  }
}

/**
 * Verify a Stripe webhook signature header. Returns the parsed event when
 * valid, or null when invalid. In stub mode (no STRIPE_WEBHOOK_SECRET) we
 * accept the body as-is so local-dev replays of the success URL work.
 *
 * @param rawBody Raw request body string.
 * @param signatureHeader The `stripe-signature` header value.
 * @param secret Webhook secret (STRIPE_WEBHOOK_SECRET).
 */
export async function verifyAndParseWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | null,
): Promise<{ id: string; type: string; data: { object: unknown } } | null> {
  if (!secret) {
    try {
      return JSON.parse(rawBody) as { id: string; type: string; data: { object: unknown } };
    } catch {
      return null;
    }
  }
  if (!signatureHeader) return null;

  // Stripe ships its own constructEvent, but importing the SDK only for that
  // doubles cold-start time. We replicate the small piece we need: parse the
  // `t=...,v1=...` header, hash `<t>.<rawBody>` with HMAC-SHA256, compare.
  const parts = signatureHeader.split(',');
  let timestamp: string | null = null;
  let v1: string | null = null;
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') timestamp = v ?? null;
    if (k === 'v1') v1 = v ?? null;
  }
  if (!timestamp || !v1) return null;
  const signed = `${timestamp}.${rawBody}`;
  const expected = createHmac('sha256', secret).update(signed).digest('hex');
  if (expected.length !== v1.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    return JSON.parse(rawBody) as { id: string; type: string; data: { object: unknown } };
  } catch {
    return null;
  }
}

interface StripeModuleSession {
  id: string;
  url: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  metadata: Record<string, string> | null;
  customer_email: string | null;
}

interface StripeClient {
  checkout: {
    sessions: {
      create(args: unknown): Promise<StripeModuleSession>;
      retrieve(id: string): Promise<StripeModuleSession>;
    };
  };
}

interface StripeModule {
  default: new (key: string, opts?: unknown) => StripeClient;
}

let cachedClient: StripeClient | null = null;

async function loadStripe(): Promise<StripeClient> {
  if (cachedClient) return cachedClient;
  const moduleName = 'stripe';
  const mod = (await import(/* @vite-ignore */ moduleName)) as StripeModule;
  cachedClient = new mod.default(process.env.STRIPE_SECRET_KEY ?? '');
  return cachedClient;
}

function mapStripeSession(s: StripeModuleSession): CheckoutSessionRecord {
  return {
    id: s.id,
    url: s.url ?? '',
    amountTotal: s.amount_total ?? 0,
    currency: s.currency ?? 'usd',
    paymentStatus:
      s.payment_status === 'paid'
        ? 'paid'
        : s.payment_status === 'no_payment_required'
        ? 'no_payment_required'
        : 'unpaid',
    metadata: s.metadata ?? {},
    customerEmail: s.customer_email ?? null,
  };
}

function createStubSession(input: CreateCheckoutSessionInput): CheckoutSessionRecord {
  const id = `cs_test_local_${randomBytes(8).toString('hex')}`;
  // The stub's "url" routes the browser straight at the success URL with the
  // session id appended so the post-purchase fulfillment path runs locally.
  const sep = input.successUrl.includes('?') ? '&' : '?';
  const successWithId = input.successUrl.replace('{CHECKOUT_SESSION_ID}', id);
  const url = successWithId.includes('session_id=')
    ? successWithId
    : `${successWithId}${sep}session_id=${id}`;
  const record: CheckoutSessionRecord = {
    id,
    url,
    amountTotal: input.amountUsdCents,
    currency: 'usd',
    paymentStatus: 'paid',
    metadata: input.metadata,
    customerEmail: input.customerEmail ?? null,
  };
  stubStore.set(id, record);
  return record;
}
