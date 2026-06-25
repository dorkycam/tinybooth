/**
 * Tests for the IAP wrapper. Stub mode only; the real RevenueCat path is
 * exercised on-device since the native module cannot load in node.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { __resetSecureForTests } from '../src/lib/secureStore';
import {
  __resetIapForTests,
  getCustomerInfo,
  getOfferings,
  initialize,
  purchase,
  restorePurchases,
  revenueCatConfigured,
} from '../src/lib/iap';

beforeEach(async () => {
  __resetSecureForTests();
  await __resetIapForTests();
  delete process.env.REVENUECAT_API_KEY;
  delete process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
});

describe('revenueCatConfigured', () => {
  it('returns false when no env is set', () => {
    expect(revenueCatConfigured()).toBe(false);
  });
  it('returns true when EXPO_PUBLIC_REVENUECAT_API_KEY is set', () => {
    process.env.EXPO_PUBLIC_REVENUECAT_API_KEY = 'rc_test';
    expect(revenueCatConfigured()).toBe(true);
  });
});

describe('initialize (stub mode)', () => {
  it('resolves without throwing', async () => {
    await expect(initialize()).resolves.toBeUndefined();
  });
});

describe('getOfferings', () => {
  it('returns 3 offerings with iOS platform ids by default', () => {
    const offers = getOfferings();
    expect(offers).toHaveLength(3);
    const eventPass = offers.find((o) => o.product.id === 'event_pass');
    expect(eventPass?.platformProductId).toBe('com.codesquad.tinybooth.event_pass');
    expect(eventPass?.priceCents).toBe(1499);
  });

  it('returns Android product ids when channel is android', () => {
    const offers = getOfferings('android');
    const stripUnlock = offers.find((o) => o.product.id === 'strip_unlock');
    expect(stripUnlock?.platformProductId).toBe('com.codesquad.tinybooth.strip_unlock');
  });
});

describe('purchase (stub mode)', () => {
  it('returns success and activates the entitlement', async () => {
    const r = await purchase('strip_unlock');
    expect(r.success).toBe(true);
    expect(r.errorMessage).toBeNull();
    expect(r.customerInfo?.activeEntitlements.has('strip_unlock')).toBe(true);
  });

  it('rejects unknown product ids', async () => {
    const r = await purchase('mystery');
    expect(r.success).toBe(false);
    expect(r.errorMessage).toContain('Unknown product');
  });

  it('persists the entitlement across getCustomerInfo reads', async () => {
    await purchase('event_pass');
    const info = await getCustomerInfo();
    expect(info.activeEntitlements.has('event_pass')).toBe(true);
  });

  it('multiple distinct purchases stack their entitlements', async () => {
    await purchase('event_pass');
    await purchase('strip_unlock');
    const info = await getCustomerInfo();
    expect(info.activeEntitlements.has('event_pass')).toBe(true);
    expect(info.activeEntitlements.has('strip_unlock')).toBe(true);
  });
});

describe('restorePurchases (stub mode)', () => {
  it('returns the current snapshot without error', async () => {
    await purchase('event_pass_plus');
    const snap = await restorePurchases();
    expect(snap.activeEntitlements.has('event_pass_plus')).toBe(true);
  });
});

describe('getCustomerInfo (stub mode)', () => {
  it('starts with no active entitlements', async () => {
    const snap = await getCustomerInfo();
    expect(snap.activeEntitlements.size).toBe(0);
    expect(snap.originalAppUserId).toBe('dev-stub-user');
  });
});
