/**
 * Product catalog assertions. Pricing and ids must match the spec verbatim
 * because they are referenced from external systems (App Store Connect,
 * Stripe). A drift here is a billing bug.
 */
import { describe, expect, it } from 'vitest';
import {
  EVENT_PASS,
  EVENT_PASS_PLUS,
  PRODUCTS,
  PRODUCT_LIST,
  STRIP_UNLOCK,
  platformProductId,
  productById,
  productToEventTier,
} from '../src/products';

describe('Strip Unlock', () => {
  it('is priced at $1.99 IAP only', () => {
    expect(STRIP_UNLOCK.priceUsdCents.iap).toBe(199);
    expect(STRIP_UNLOCK.priceUsdCents.web).toBe(199);
    expect(STRIP_UNLOCK.webStripeProductId).toBeNull();
  });

  it('classifies as STRIP_UNLOCK tier with no event mutations', () => {
    expect(STRIP_UNLOCK.tier).toBe('STRIP_UNLOCK');
    expect(STRIP_UNLOCK.durationDays).toBeNull();
    expect(STRIP_UNLOCK.retentionDays).toBeNull();
    expect(STRIP_UNLOCK.deliveryQuota).toBe(0);
    expect(STRIP_UNLOCK.guestCap).toBeNull();
    expect(STRIP_UNLOCK.customMessagesAllowed).toBe(false);
  });
});

describe('Event Pass', () => {
  it('is priced at $14.99 IAP / $12.99 web', () => {
    expect(EVENT_PASS.priceUsdCents.iap).toBe(1499);
    expect(EVENT_PASS.priceUsdCents.web).toBe(1299);
    expect(EVENT_PASS.webStripeProductId).toBe('tinybooth_event_pass');
  });

  it('grants 60-day retention, 50 deliveries, 150 guest cap', () => {
    expect(EVENT_PASS.retentionDays).toBe(60);
    expect(EVENT_PASS.deliveryQuota).toBe(50);
    expect(EVENT_PASS.guestCap).toBe(150);
    expect(EVENT_PASS.customMessagesAllowed).toBe(false);
  });
});

describe('Event Pass Plus', () => {
  it('is priced at $39 IAP / $34 web', () => {
    expect(EVENT_PASS_PLUS.priceUsdCents.iap).toBe(3900);
    expect(EVENT_PASS_PLUS.priceUsdCents.web).toBe(3400);
    expect(EVENT_PASS_PLUS.webStripeProductId).toBe('tinybooth_event_pass_plus');
  });

  it('grants 90-day retention, 250 deliveries, unlimited guests, custom messages', () => {
    expect(EVENT_PASS_PLUS.retentionDays).toBe(90);
    expect(EVENT_PASS_PLUS.deliveryQuota).toBe(250);
    expect(EVENT_PASS_PLUS.guestCap).toBeNull();
    expect(EVENT_PASS_PLUS.customMessagesAllowed).toBe(true);
  });
});

describe('PRODUCTS index', () => {
  it('contains all three products keyed by id', () => {
    expect(PRODUCTS.strip_unlock).toBe(STRIP_UNLOCK);
    expect(PRODUCTS.event_pass).toBe(EVENT_PASS);
    expect(PRODUCTS.event_pass_plus).toBe(EVENT_PASS_PLUS);
  });

  it('PRODUCT_LIST orders Event Pass first, Plus second, Strip Unlock last', () => {
    expect(PRODUCT_LIST).toEqual([EVENT_PASS, EVENT_PASS_PLUS, STRIP_UNLOCK]);
  });
});

describe('productById', () => {
  it('returns the catalog row for known ids', () => {
    expect(productById('event_pass')).toBe(EVENT_PASS);
    expect(productById('event_pass_plus')).toBe(EVENT_PASS_PLUS);
    expect(productById('strip_unlock')).toBe(STRIP_UNLOCK);
  });

  it('returns null for unknown ids', () => {
    expect(productById('mystery')).toBeNull();
    expect(productById('')).toBeNull();
  });
});

describe('platformProductId', () => {
  it('returns iOS / Android / Stripe ids per channel', () => {
    expect(platformProductId(EVENT_PASS, 'ios')).toBe('com.codesquad.tinybooth.event_pass');
    expect(platformProductId(EVENT_PASS, 'android')).toBe('com.codesquad.tinybooth.event_pass');
    expect(platformProductId(EVENT_PASS, 'web')).toBe('tinybooth_event_pass');
  });

  it('returns null for Strip Unlock on web (IAP only)', () => {
    expect(platformProductId(STRIP_UNLOCK, 'web')).toBeNull();
  });
});

describe('productToEventTier', () => {
  it('maps event_pass and event_pass_plus to enum values', () => {
    expect(productToEventTier('event_pass')).toBe('EVENT_PASS');
    expect(productToEventTier('event_pass_plus')).toBe('EVENT_PASS_PLUS');
  });

  it('returns null for non-tier products', () => {
    expect(productToEventTier('strip_unlock')).toBeNull();
    expect(productToEventTier('mystery')).toBeNull();
  });
});
