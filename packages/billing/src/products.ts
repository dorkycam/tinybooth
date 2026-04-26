/**
 * TinyBooth product catalog. Single source of truth used by:
 *   - the mobile RevenueCat wrapper (offerings + purchase),
 *   - the web Stripe checkout creator,
 *   - the RevenueCat + Stripe webhook handlers,
 *   - the dashboard paywall page,
 *   - server-side entitlement gating.
 *
 * Prices come from `docs/plan.md` section 2 ("Pricing tiers and prices") and
 * the unit economics in `docs/research/monetization.md` section 6.3. The web
 * Stripe price is intentionally lower than IAP to reflect Apple's 15% Small
 * Business take.
 */

/** Ids the rest of the system uses to look up a product. */
export type ProductId = 'strip_unlock' | 'event_pass' | 'event_pass_plus';

/** Entitlement keys mounted on RevenueCat and consumed by the mobile hook. */
export type EntitlementKey = 'strip_unlock' | 'event_pass' | 'event_pass_plus';

/** Tier the product unlocks on the linked Event row, when it changes the tier. */
export type ProductTier = 'STRIP_UNLOCK' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';

/**
 * A product description. `priceUsdCents.web` is the Stripe price (web). `iap`
 * is the App Store / Play Store price (they match cross-store on purpose to
 * avoid storefront pricing complaints).
 */
export interface Product {
  /** Internal product id used in code paths and as the RC product identifier. */
  id: ProductId;
  /** Display name shown on the paywall. */
  name: string;
  /** One-line description shown under the name. */
  description: string;
  /** App Store Connect product id. Provisioned by Camrynn per docs/iap-setup.md. */
  iosProductId: string;
  /** Google Play Console product id. Same provisioning notes as iosProductId. */
  androidProductId: string;
  /** Stripe product id (web). Null for products not sold on the web. */
  webStripeProductId: string | null;
  /** Cents pricing per channel. Both keys must be present for type safety. */
  priceUsdCents: {
    /** App Store / Play Store price, in cents. */
    iap: number;
    /** Stripe web price, in cents. Equal to iap when not discounted on web. */
    web: number;
  };
  /** RevenueCat entitlement key the product unlocks. */
  entitlement: EntitlementKey;
  /** Tier classification for downstream gating. */
  tier: ProductTier;
  /**
   * Active duration in days when the purchase applies to an Event. Strip
   * Unlock has no duration since it modifies a single Strip row.
   */
  durationDays: number | null;
  /**
   * Days of post-event retention added to `Event.retainUntil`. Strip Unlock
   * does not extend retention.
   */
  retentionDays: number | null;
  /**
   * Email + SMS deliveries granted by this product. Strip Unlock grants 0.
   */
  deliveryQuota: number;
  /**
   * TinyWall guest upload cap when this product is applied. Null means
   * unlimited (Event Pass Plus). Strip Unlock does not change the cap.
   */
  guestCap: number | null;
  /** Whether the host can add custom random messages with this product. */
  customMessagesAllowed: boolean;
}

/**
 * One-shot purchase that removes the watermark from the user's most recent
 * standalone strip. IAP only by design (the web has no booth surface).
 */
export const STRIP_UNLOCK: Product = {
  id: 'strip_unlock',
  name: 'Strip Unlock',
  description: 'Remove the wordmark from your most recent strip.',
  iosProductId: 'com.codesquad.tinybooth.strip_unlock',
  androidProductId: 'com.codesquad.tinybooth.strip_unlock',
  webStripeProductId: null,
  priceUsdCents: { iap: 199, web: 199 },
  entitlement: 'strip_unlock',
  tier: 'STRIP_UNLOCK',
  durationDays: null,
  retentionDays: null,
  deliveryQuota: 0,
  guestCap: null,
  customMessagesAllowed: false,
};

/**
 * Event Pass: one event, branded, 60-day retention, 50 deliveries, 150 guest
 * cap, dashboard, bulk export, watermark removed.
 */
export const EVENT_PASS: Product = {
  id: 'event_pass',
  name: 'Event Pass',
  description: 'One event, custom branding, 150 guests, 60 day photo retention.',
  iosProductId: 'com.codesquad.tinybooth.event_pass',
  androidProductId: 'com.codesquad.tinybooth.event_pass',
  webStripeProductId: 'tinybooth_event_pass',
  priceUsdCents: { iap: 1499, web: 1299 },
  entitlement: 'event_pass',
  tier: 'EVENT_PASS',
  durationDays: 1,
  retentionDays: 60,
  deliveryQuota: 50,
  guestCap: 150,
  customMessagesAllowed: false,
};

/**
 * Event Pass Plus: same as Event Pass plus unlimited guests, 90-day retention,
 * 250 deliveries, custom message library.
 */
export const EVENT_PASS_PLUS: Product = {
  id: 'event_pass_plus',
  name: 'Event Pass Plus',
  description: 'Unlimited guests, 90 day retention, 250 deliveries, custom messages.',
  iosProductId: 'com.codesquad.tinybooth.event_pass_plus',
  androidProductId: 'com.codesquad.tinybooth.event_pass_plus',
  webStripeProductId: 'tinybooth_event_pass_plus',
  priceUsdCents: { iap: 3900, web: 3400 },
  entitlement: 'event_pass_plus',
  tier: 'EVENT_PASS_PLUS',
  durationDays: 1,
  retentionDays: 90,
  deliveryQuota: 250,
  guestCap: null,
  customMessagesAllowed: true,
};

/**
 * Index every product by id. Use `productById(id)` for a typed lookup.
 */
export const PRODUCTS: Readonly<Record<ProductId, Product>> = Object.freeze({
  strip_unlock: STRIP_UNLOCK,
  event_pass: EVENT_PASS,
  event_pass_plus: EVENT_PASS_PLUS,
});

/**
 * The full catalog as an array. Order matches the paywall display order:
 * Event Pass first (the typical purchase), Plus second (the upsell), Strip
 * Unlock last (the safety valve).
 */
export const PRODUCT_LIST: readonly Product[] = [
  EVENT_PASS,
  EVENT_PASS_PLUS,
  STRIP_UNLOCK,
];

/**
 * Type-narrowing lookup by product id. Returns null on unknown ids.
 *
 * @param id Product identifier.
 */
export function productById(id: string): Product | null {
  if (id === 'strip_unlock' || id === 'event_pass' || id === 'event_pass_plus') {
    return PRODUCTS[id];
  }
  return null;
}

/**
 * Resolve the platform product id (App Store / Play Store / Stripe) for a
 * given product on a given channel. Useful for the RC wrapper and the Stripe
 * checkout endpoint.
 *
 * @param product Product to resolve.
 * @param channel Channel for which the platform id is needed.
 */
export function platformProductId(
  product: Product,
  channel: 'ios' | 'android' | 'web',
): string | null {
  switch (channel) {
    case 'ios':
      return product.iosProductId;
    case 'android':
      return product.androidProductId;
    case 'web':
      return product.webStripeProductId;
  }
}

/**
 * Map a paid Event-tier product to the Prisma EventTier enum value the
 * database expects. Returns null for products that do not change the event
 * tier (currently `strip_unlock`).
 *
 * @param productId Internal product id.
 */
export function productToEventTier(productId: string): 'EVENT_PASS' | 'EVENT_PASS_PLUS' | null {
  if (productId === 'event_pass') return 'EVENT_PASS';
  if (productId === 'event_pass_plus') return 'EVENT_PASS_PLUS';
  return null;
}
