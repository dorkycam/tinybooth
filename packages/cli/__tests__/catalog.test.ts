/**
 * Bridge tests: every web-sold product in `@tinybooth/billing` must produce
 * a Stripe payload whose price + ids match the catalog. A drift here is a
 * billing bug that would charge the wrong amount.
 */
import { describe, expect, it } from 'vitest';
import { EVENT_PASS, EVENT_PASS_PLUS, STRIP_UNLOCK } from '@tinybooth/billing';
import {
  isAlreadyOnStripe,
  productToStripePayload,
  stripeCatalog,
} from '../src/lib/catalog';

describe('productToStripePayload', () => {
  it('maps Event Pass with its $12.99 web price', () => {
    const payload = productToStripePayload(EVENT_PASS);
    expect(payload.id).toBe('tinybooth_event_pass');
    expect(payload.priceUsdCents).toBe(1299);
    expect(payload.metadata.product_id).toBe('event_pass');
    expect(payload.metadata.tier).toBe('EVENT_PASS');
    expect(payload.metadata.entitlement).toBe('event_pass');
  });

  it('maps Event Pass Plus with its $34 web price', () => {
    const payload = productToStripePayload(EVENT_PASS_PLUS);
    expect(payload.id).toBe('tinybooth_event_pass_plus');
    expect(payload.priceUsdCents).toBe(3400);
  });

  it('refuses to map a product with no web Stripe id (Strip Unlock is IAP only)', () => {
    expect(() => productToStripePayload(STRIP_UNLOCK)).toThrow(/strip_unlock/);
  });
});

describe('stripeCatalog', () => {
  it('returns only the two web-sold products in catalog order', () => {
    const catalog = stripeCatalog();
    expect(catalog.map((c) => c.id)).toEqual([
      'tinybooth_event_pass',
      'tinybooth_event_pass_plus',
    ]);
  });
});

describe('isAlreadyOnStripe', () => {
  it('matches by Stripe product id', () => {
    const payload = productToStripePayload(EVENT_PASS);
    const existing = [{ id: 'tinybooth_event_pass', metadata: {} }];
    expect(isAlreadyOnStripe(existing, payload)).toBe(true);
  });

  it('matches by metadata.product_id', () => {
    const payload = productToStripePayload(EVENT_PASS);
    const existing = [
      { id: 'prod_abc', metadata: { product_id: 'event_pass' } },
    ];
    expect(isAlreadyOnStripe(existing, payload)).toBe(true);
  });

  it('returns false when nothing matches', () => {
    const payload = productToStripePayload(EVENT_PASS);
    const existing = [{ id: 'something_else', metadata: { product_id: 'else' } }];
    expect(isAlreadyOnStripe(existing, payload)).toBe(false);
  });
});
