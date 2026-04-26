/**
 * `stripe` CLI wrapper plus the lazy-loaded HTTP SDK fallback for product
 * mutations the CLI does not expose. We prefer the CLI everywhere it works
 * because that is what the user would type by hand and it carries the same
 * auth context.
 *
 * The SDK is lazy-imported (matches `apps/web/src/lib/stripe.ts`) so
 * `pnpm install` of `@tinybooth/cli` does not pull `stripe` until a command
 * actually needs it.
 */
import { run, runOk } from './shell.js';

/** Whether the Stripe CLI is logged in. */
export async function isLoggedIn(): Promise<boolean> {
  return runOk('stripe', ['config', '--list']);
}

/** Spawn `stripe login` interactively. */
export async function login(dryRun: boolean): Promise<void> {
  await run('stripe', ['login'], { stdio: 'inherit', dryRun });
}

/**
 * Create a Stripe webhook endpoint. Returns the resulting signing secret.
 * Empty string under dry-run.
 *
 * @param url Endpoint URL.
 * @param events Stripe event names to subscribe to.
 */
export async function createWebhookEndpoint(
  url: string,
  events: readonly string[],
  dryRun: boolean,
): Promise<string> {
  const args = ['webhook_endpoints', 'create', '--url', url];
  for (const event of events) args.push('--enabled-events', event);
  const result = await run('stripe', args, { dryRun });
  // CLI prints a JSON object whose `secret` field is what we need.
  if (result.stdout.length === 0) return '';
  try {
    const parsed = JSON.parse(result.stdout) as { secret?: string };
    return parsed.secret ?? '';
  } catch {
    return '';
  }
}

/** Lazy-loaded Stripe Node SDK type, imported on first use. */
type StripeCtor = new (key: string, opts?: Record<string, unknown>) => {
  products: {
    list: (opts: { limit: number }) => Promise<{ data: Array<{ id: string; metadata: Record<string, string> }> }>;
    create: (body: Record<string, unknown>) => Promise<{ id: string }>;
  };
  prices: {
    create: (body: Record<string, unknown>) => Promise<{ id: string }>;
  };
};

let cachedStripe: StripeCtor | null = null;

/**
 * Lazy-load the Stripe SDK. Mirrors the lazy-import pattern in
 * `apps/web/src/lib/stripe.ts`. Tests inject a fake via `setStripeImpl`.
 *
 * The `stripe` SDK is not a dev dep of this package on purpose. The web app
 * already depends on it; we use the same install at runtime.
 */
async function getStripe(): Promise<StripeCtor> {
  if (cachedStripe !== null) return cachedStripe;
  const mod = (await import(/* @vite-ignore */ 'stripe' as string)) as unknown as {
    default: StripeCtor;
  };
  cachedStripe = mod.default;
  return cachedStripe;
}

/** Override the Stripe SDK constructor (test-only). */
export function setStripeImpl(ctor: StripeCtor | null): void {
  cachedStripe = ctor;
}

/** Pull a paged list of products via the SDK. Used to dedupe before create. */
export async function listProducts(
  apiKey: string,
): Promise<Array<{ id: string; metadata: Record<string, string> }>> {
  const Stripe = await getStripe();
  const client = new Stripe(apiKey);
  const page = await client.products.list({ limit: 100 });
  return page.data;
}

/**
 * Create a product + a one-time price atomically. Returns the new ids.
 * Throws if the SDK call fails (no dry-run handling here; the caller decides
 * to skip on dry-run).
 */
export async function createProductWithPrice(
  apiKey: string,
  product: {
    id: string;
    name: string;
    description: string;
    metadata: Record<string, string>;
    priceUsdCents: number;
  },
): Promise<{ productId: string; priceId: string }> {
  const Stripe = await getStripe();
  const client = new Stripe(apiKey);
  const created = await client.products.create({
    id: product.id,
    name: product.name,
    description: product.description,
    metadata: product.metadata,
  });
  const price = await client.prices.create({
    product: created.id,
    currency: 'usd',
    unit_amount: product.priceUsdCents,
  });
  return { productId: created.id, priceId: price.id };
}
