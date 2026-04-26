/**
 * Bridge between `@tinybooth/billing` PRODUCTS and the Stripe products /
 * prices payload. Keeps the catalog as a single source of truth and lets
 * `setup` materialize Stripe in one pass without hand-typing prices.
 */
import { PRODUCT_LIST } from '@tinybooth/billing';
import type { Product } from '@tinybooth/billing';

/** Payload shape consumed by `lib/stripe.ts#createProductWithPrice`. */
export interface StripeProductPayload {
  /** Stripe `id` to pin (so re-runs are idempotent). */
  id: string;
  /** Display name on the Stripe dashboard. */
  name: string;
  /** Long-form description on the Stripe checkout page. */
  description: string;
  /** Metadata used for idempotency lookups (`product_id` carries our id). */
  metadata: Record<string, string>;
  /** Web price in USD cents. Must come from `@tinybooth/billing`. */
  priceUsdCents: number;
}

/** Convert a single billing Product into the Stripe payload. */
export function productToStripePayload(product: Product): StripeProductPayload {
  if (product.webStripeProductId === null) {
    throw new Error(`Product ${product.id} has no web Stripe id; do not push to Stripe`);
  }
  return {
    id: product.webStripeProductId,
    name: product.name,
    description: product.description,
    metadata: {
      product_id: product.id,
      tier: product.tier,
      entitlement: product.entitlement,
    },
    priceUsdCents: product.priceUsdCents.web,
  };
}

/**
 * Return the Stripe payloads for every billing product that is sold on the
 * web (skips Strip Unlock, which is IAP only).
 */
export function stripeCatalog(): StripeProductPayload[] {
  return PRODUCT_LIST.filter((p) => p.webStripeProductId !== null).map(productToStripePayload);
}

/** Decide whether a Stripe product list already contains our product id. */
export function isAlreadyOnStripe(
  existing: ReadonlyArray<{ id: string; metadata: Record<string, string> }>,
  payload: StripeProductPayload,
): boolean {
  return existing.some(
    (row) =>
      row.id === payload.id || row.metadata.product_id === payload.metadata.product_id,
  );
}
