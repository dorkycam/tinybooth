/**
 * Mobile IAP wrapper.
 *
 * Two modes:
 *   - Real: REVENUECAT_API_KEY (or EXPO_PUBLIC_REVENUECAT_API_KEY) is set.
 *     We lazy-import `react-native-purchases`, configure it once, and proxy
 *     `purchase`, `restorePurchases`, and `getCustomerInfo` straight through.
 *   - Stub: env is absent. Every purchase resolves successfully and writes a
 *     local entitlement record to AsyncStorage so the rest of the UI is
 *     testable without provisioning App Store Connect or RevenueCat.
 *
 * The lazy import keeps `react-native-purchases` (a native module) out of the
 * Vitest path: tests run in node and never see it.
 *
 * Anti-steering: nothing in this module references the web purchase URL.
 * iOS code paths must NEVER show "buy on web" for these products at launch.
 */
import { PRODUCTS, productById, type EntitlementKey, type Product } from '@tinybooth/billing';
import { deleteSecure, readSecure, writeSecure } from './secureStore';

const STUB_ENTITLEMENTS_KEY = '@tinybooth/iap/stub-entitlements';

interface StubEntitlements {
  active: Record<string, { productId: string; purchasedAt: string }>;
}

/** Returns true when a real RevenueCat key is configured. */
export function revenueCatConfigured(): boolean {
  const key = process.env.REVENUECAT_API_KEY ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  return Boolean(key && key.length > 0);
}

/**
 * Initialize RevenueCat. Idempotent: subsequent calls are no-ops. In stub mode
 * we just resolve so `useEffect` chains do not throw.
 */
let initialized = false;
export async function initialize(): Promise<void> {
  if (initialized) return;
  if (!revenueCatConfigured()) {
    initialized = true;
    return;
  }
  const Purchases = await loadPurchases();
  const apiKey = process.env.REVENUECAT_API_KEY ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '';
  Purchases.configure({ apiKey });
  initialized = true;
}

/** Result returned by `purchase()`. */
export interface PurchaseResult {
  success: boolean;
  customerInfo: CustomerInfoSnapshot | null;
  errorMessage: string | null;
}

/**
 * Customer-info snapshot. Mirrors the small subset of RevenueCat's
 * `CustomerInfo` we actually use. Stripped down so it stays JSON-serializable.
 */
export interface CustomerInfoSnapshot {
  /** Set of currently-active entitlement keys. */
  activeEntitlements: Set<EntitlementKey>;
  /** Original RC userId (or stub user when in stub mode). */
  originalAppUserId: string;
}

/**
 * Build the typed offerings the paywall renders. Each entry pairs the catalog
 * row with its platform identifier so the paywall does not have to switch on
 * Platform.OS itself.
 */
export interface Offering {
  product: Product;
  /** Platform-specific identifier the IAP framework recognizes. */
  platformProductId: string;
  /** Display price (cents) for the local channel. */
  priceCents: number;
}

/** Channel detected from the runtime. We assume iOS unless explicitly told. */
export type IapChannel = 'ios' | 'android';

/**
 * Return the typed offerings list filtered to the current channel.
 *
 * @param channel `ios` or `android`. Defaults to `ios`.
 */
export function getOfferings(channel: IapChannel = 'ios'): Offering[] {
  return Object.values(PRODUCTS).map((product) => ({
    product,
    platformProductId:
      channel === 'ios' ? product.iosProductId : product.androidProductId,
    priceCents: product.priceUsdCents.iap,
  }));
}

/**
 * Trigger a purchase. In real mode this calls RevenueCat. In stub mode it
 * marks the entitlement as active locally and resolves success.
 *
 * @param productId Internal product id from `@tinybooth/billing`.
 * @param channel iOS or Android (defaults iOS).
 */
export async function purchase(
  productId: string,
  channel: IapChannel = 'ios',
): Promise<PurchaseResult> {
  await initialize();
  const product = productById(productId);
  if (!product) {
    return {
      success: false,
      customerInfo: null,
      errorMessage: `Unknown product: ${productId}`,
    };
  }
  if (!revenueCatConfigured()) {
    await markStubEntitlementActive(product.entitlement, product.id);
    return {
      success: true,
      customerInfo: await getCustomerInfo(),
      errorMessage: null,
    };
  }
  try {
    const Purchases = await loadPurchases();
    const platformId =
      channel === 'ios' ? product.iosProductId : product.androidProductId;
    const result = await Purchases.purchaseProduct(platformId);
    return {
      success: true,
      customerInfo: snapshotCustomerInfo(result.customerInfo),
      errorMessage: null,
    };
  } catch (err) {
    const e = err as { userCancelled?: boolean; message?: string };
    return {
      success: false,
      customerInfo: null,
      errorMessage: e.userCancelled ? 'cancelled' : e.message ?? 'Purchase failed',
    };
  }
}

/**
 * Restore previous purchases. Apple-required (Guideline 3.1.1) for
 * non-consumables and subscriptions. Consumables technically don't need it
 * but RevenueCat's restore is a single call so we expose it anyway.
 */
export async function restorePurchases(): Promise<CustomerInfoSnapshot> {
  await initialize();
  if (!revenueCatConfigured()) return getCustomerInfo();
  const Purchases = await loadPurchases();
  const customerInfo = await Purchases.restorePurchases();
  return snapshotCustomerInfo(customerInfo);
}

/** Read the current customer info snapshot. */
export async function getCustomerInfo(): Promise<CustomerInfoSnapshot> {
  await initialize();
  if (!revenueCatConfigured()) {
    const stub = await readStubEntitlements();
    return {
      activeEntitlements: new Set<EntitlementKey>(
        Object.keys(stub.active).filter(isEntitlementKey),
      ),
      originalAppUserId: 'dev-stub-user',
    };
  }
  const Purchases = await loadPurchases();
  return snapshotCustomerInfo(await Purchases.getCustomerInfo());
}

/** Reset helper for tests. */
export async function __resetIapForTests(): Promise<void> {
  initialized = false;
  await deleteSecure(STUB_ENTITLEMENTS_KEY);
}

interface PurchasesCustomerInfo {
  entitlements?: { active?: Record<string, unknown> };
  originalAppUserId?: string;
}

interface PurchasesModule {
  configure(opts: { apiKey: string }): void;
  purchaseProduct(productId: string): Promise<{ customerInfo: PurchasesCustomerInfo }>;
  restorePurchases(): Promise<PurchasesCustomerInfo>;
  getCustomerInfo(): Promise<PurchasesCustomerInfo>;
}

let cachedPurchases: PurchasesModule | null = null;

async function loadPurchases(): Promise<PurchasesModule> {
  if (cachedPurchases) return cachedPurchases;
  const moduleName = 'react-native-purchases';
  const mod = (await import(/* @vite-ignore */ moduleName)) as { default?: PurchasesModule };
  const m = mod.default ?? (mod as unknown as PurchasesModule);
  cachedPurchases = m;
  return m;
}

function snapshotCustomerInfo(info: PurchasesCustomerInfo): CustomerInfoSnapshot {
  const active = info.entitlements?.active ?? {};
  const set = new Set<EntitlementKey>(Object.keys(active).filter(isEntitlementKey));
  return {
    activeEntitlements: set,
    originalAppUserId: info.originalAppUserId ?? 'unknown',
  };
}

function isEntitlementKey(key: string): key is EntitlementKey {
  return key === 'strip_unlock' || key === 'event_pass' || key === 'event_pass_plus';
}

async function readStubEntitlements(): Promise<StubEntitlements> {
  const raw = await readSecure(STUB_ENTITLEMENTS_KEY);
  if (!raw) return { active: {} };
  try {
    return JSON.parse(raw) as StubEntitlements;
  } catch {
    return { active: {} };
  }
}

async function markStubEntitlementActive(
  entitlement: EntitlementKey,
  productId: string,
): Promise<void> {
  const current = await readStubEntitlements();
  current.active[entitlement] = {
    productId,
    purchasedAt: new Date().toISOString(),
  };
  await writeSecure(STUB_ENTITLEMENTS_KEY, JSON.stringify(current));
}
