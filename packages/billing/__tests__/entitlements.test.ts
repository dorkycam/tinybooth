/**
 * Tests for the entitlement evaluator. Every tier + every flag is asserted
 * because feature gating across the codebase reads off this output.
 */
import { describe, expect, it } from 'vitest';
import {
  FREE_TIER_GUEST_CAP,
  FREE_TIER_RETENTION_DAYS,
  canAcceptGuestUpload,
  canDeliver,
  evaluateEvent,
  type EventInput,
  type PurchaseInput,
} from '../src/entitlements';

function makeEvent(overrides: Partial<EventInput> = {}): EventInput {
  return {
    id: 'ev1',
    tier: 'FREE',
    endsAt: null,
    createdAt: new Date('2026-04-26T00:00:00Z'),
    emailDeliveries: 0,
    smsDeliveries: 0,
    ...overrides,
  };
}

describe('evaluateEvent on FREE tier', () => {
  it('returns FREE defaults when no purchases applied', () => {
    const e = evaluateEvent(makeEvent());
    expect(e.tier).toBe('FREE');
    expect(e.watermarkRemoved).toBe(false);
    expect(e.customBranding).toBe(false);
    expect(e.logoUploadAllowed).toBe(false);
    expect(e.dashboardExportAllowed).toBe(false);
    expect(e.videoUploadsAllowed).toBe(false);
    expect(e.customMessagesAllowed).toBe(false);
    expect(e.retentionDays).toBe(FREE_TIER_RETENTION_DAYS);
    expect(e.guestCap).toBe(FREE_TIER_GUEST_CAP);
    expect(e.emailQuota).toBe(0);
    expect(e.smsQuota).toBe(0);
    expect(e.emailDeliveriesRemaining).toBe(0);
    expect(e.smsDeliveriesRemaining).toBe(0);
  });

  it('ignores revoked Event Pass purchases', () => {
    const purchases: PurchaseInput[] = [
      { id: 'p1', product: 'event_pass', createdAt: new Date(), revokedAt: new Date() },
    ];
    const e = evaluateEvent(makeEvent(), purchases);
    expect(e.tier).toBe('FREE');
    expect(e.watermarkRemoved).toBe(false);
  });
});

describe('evaluateEvent on EVENT_PASS', () => {
  it('returns Event Pass entitlements when tier is EVENT_PASS in DB', () => {
    const e = evaluateEvent(makeEvent({ tier: 'EVENT_PASS' }));
    expect(e.tier).toBe('EVENT_PASS');
    expect(e.watermarkRemoved).toBe(true);
    expect(e.customBranding).toBe(true);
    expect(e.logoUploadAllowed).toBe(true);
    expect(e.dashboardExportAllowed).toBe(true);
    expect(e.videoUploadsAllowed).toBe(true);
    expect(e.customMessagesAllowed).toBe(false);
    expect(e.retentionDays).toBe(60);
    expect(e.guestCap).toBe(150);
    expect(e.emailQuota).toBe(50);
    expect(e.smsQuota).toBe(50);
  });

  it('subtracts consumed deliveries from the quota', () => {
    const e = evaluateEvent(
      makeEvent({ tier: 'EVENT_PASS', emailDeliveries: 30, smsDeliveries: 49 }),
    );
    expect(e.emailDeliveriesRemaining).toBe(20);
    expect(e.smsDeliveriesRemaining).toBe(1);
  });

  it('clamps remaining deliveries at zero on overage', () => {
    const e = evaluateEvent(
      makeEvent({ tier: 'EVENT_PASS', emailDeliveries: 999, smsDeliveries: 999 }),
    );
    expect(e.emailDeliveriesRemaining).toBe(0);
    expect(e.smsDeliveriesRemaining).toBe(0);
  });

  it('upgrades a FREE event when an active Event Pass purchase is supplied', () => {
    const purchases: PurchaseInput[] = [
      { id: 'p1', product: 'event_pass', createdAt: new Date() },
    ];
    const e = evaluateEvent(makeEvent({ tier: 'FREE' }), purchases);
    expect(e.tier).toBe('EVENT_PASS');
    expect(e.watermarkRemoved).toBe(true);
  });
});

describe('evaluateEvent on EVENT_PASS_PLUS', () => {
  it('returns Plus entitlements with unlimited guests + custom messages', () => {
    const e = evaluateEvent(makeEvent({ tier: 'EVENT_PASS_PLUS' }));
    expect(e.tier).toBe('EVENT_PASS_PLUS');
    expect(e.guestCap).toBeNull();
    expect(e.retentionDays).toBe(90);
    expect(e.emailQuota).toBe(250);
    expect(e.smsQuota).toBe(250);
    expect(e.customMessagesAllowed).toBe(true);
  });

  it('a Plus purchase trumps an Event Pass purchase on the same event', () => {
    const purchases: PurchaseInput[] = [
      { id: 'p1', product: 'event_pass', createdAt: new Date() },
      { id: 'p2', product: 'event_pass_plus', createdAt: new Date() },
    ];
    const e = evaluateEvent(makeEvent({ tier: 'FREE' }), purchases);
    expect(e.tier).toBe('EVENT_PASS_PLUS');
  });

  it('an unrelated product (strip_unlock) does not change the tier', () => {
    const purchases: PurchaseInput[] = [
      { id: 'p1', product: 'strip_unlock', createdAt: new Date() },
    ];
    const e = evaluateEvent(makeEvent({ tier: 'FREE' }), purchases);
    expect(e.tier).toBe('FREE');
  });
});

describe('canAcceptGuestUpload', () => {
  it('allows up to FREE_TIER_GUEST_CAP - 1 uploads', () => {
    const ev = makeEvent();
    expect(canAcceptGuestUpload(ev, 99)).toBe(true);
    expect(canAcceptGuestUpload(ev, 100)).toBe(false);
  });

  it('respects the EVENT_PASS cap of 150', () => {
    const ev = makeEvent({ tier: 'EVENT_PASS' });
    expect(canAcceptGuestUpload(ev, 149)).toBe(true);
    expect(canAcceptGuestUpload(ev, 150)).toBe(false);
  });

  it('returns true for unlimited tier (Event Pass Plus)', () => {
    const ev = makeEvent({ tier: 'EVENT_PASS_PLUS' });
    expect(canAcceptGuestUpload(ev, 100_000)).toBe(true);
  });
});

describe('canDeliver', () => {
  it('returns false on FREE for both channels', () => {
    expect(canDeliver(makeEvent(), 'email')).toBe(false);
    expect(canDeliver(makeEvent(), 'sms')).toBe(false);
  });

  it('returns true while quota remains, false once exhausted', () => {
    expect(canDeliver(makeEvent({ tier: 'EVENT_PASS', emailDeliveries: 49 }), 'email')).toBe(true);
    expect(canDeliver(makeEvent({ tier: 'EVENT_PASS', emailDeliveries: 50 }), 'email')).toBe(false);
    expect(canDeliver(makeEvent({ tier: 'EVENT_PASS_PLUS', smsDeliveries: 250 }), 'sms')).toBe(false);
  });
});
