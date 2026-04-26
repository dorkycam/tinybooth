/**
 * Tests for the Stripe wrapper. Stub mode only; the real SDK path is exercised
 * implicitly by the webhook signature math.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  __resetStripeStubForTests,
  createCheckoutSession,
  retrieveSession,
  stripeConfigured,
  verifyAndParseWebhook,
} from '../src/lib/stripe';

beforeEach(() => {
  __resetStripeStubForTests();
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

describe('stripeConfigured', () => {
  it('reflects the STRIPE_SECRET_KEY env', () => {
    expect(stripeConfigured()).toBe(false);
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    expect(stripeConfigured()).toBe(true);
  });
});

describe('createCheckoutSession (stub mode)', () => {
  it('returns a cs_test_local_ session marked paid', async () => {
    const s = await createCheckoutSession({
      productId: 'event_pass',
      amountUsdCents: 1299,
      productName: 'Event Pass',
      productDescription: 'desc',
      successUrl: 'https://x/dashboard?purchase=success&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://x/dashboard?purchase=cancelled',
      metadata: { eventId: 'e1', productId: 'event_pass', userId: 'u1' },
    });
    expect(s.id).toMatch(/^cs_test_local_/);
    expect(s.paymentStatus).toBe('paid');
    expect(s.url).toContain(`session_id=${s.id}`);
    expect(s.amountTotal).toBe(1299);
  });

  it('substitutes {CHECKOUT_SESSION_ID} in the success URL', async () => {
    const s = await createCheckoutSession({
      productId: 'event_pass',
      amountUsdCents: 1299,
      productName: 'X',
      productDescription: 'd',
      successUrl: 'https://x/?purchase=success&session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://x/?purchase=cancelled',
      metadata: {},
    });
    expect(s.url).toContain(s.id);
    expect(s.url).not.toContain('{CHECKOUT_SESSION_ID}');
  });

  it('appends session_id when the success URL lacks the placeholder', async () => {
    const s = await createCheckoutSession({
      productId: 'event_pass',
      amountUsdCents: 1299,
      productName: 'X',
      productDescription: 'd',
      successUrl: 'https://x/done',
      cancelUrl: 'https://x/cancelled',
      metadata: {},
    });
    expect(s.url).toContain(`session_id=${s.id}`);
  });
});

describe('retrieveSession (stub mode)', () => {
  it('returns the previously created stub by id', async () => {
    const created = await createCheckoutSession({
      productId: 'event_pass',
      amountUsdCents: 1299,
      productName: 'X',
      productDescription: 'd',
      successUrl: 'https://x/done?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: 'https://x/cancelled',
      metadata: { eventId: 'e1' },
    });
    const found = await retrieveSession(created.id);
    expect(found?.id).toBe(created.id);
  });

  it('returns null on miss', async () => {
    expect(await retrieveSession('cs_test_local_missing')).toBeNull();
  });
});

describe('verifyAndParseWebhook', () => {
  it('parses without verification when no secret is set', async () => {
    const body = JSON.stringify({ id: 'evt_1', type: 'x', data: { object: {} } });
    const ev = await verifyAndParseWebhook(body, null, null);
    expect(ev?.id).toBe('evt_1');
  });

  it('returns null when JSON is malformed and no secret is set', async () => {
    const ev = await verifyAndParseWebhook('not-json', null, null);
    expect(ev).toBeNull();
  });

  it('returns null when secret is set but no signature header is provided', async () => {
    const body = JSON.stringify({ id: 'evt_1', type: 'x', data: { object: {} } });
    const ev = await verifyAndParseWebhook(body, null, 'whsec_x');
    expect(ev).toBeNull();
  });

  it('accepts a valid t=...,v1=... signature', async () => {
    const secret = 'whsec_test';
    const body = JSON.stringify({ id: 'evt_1', type: 'x', data: { object: {} } });
    const t = '1700000000';
    const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
    const sig = `t=${t},v1=${v1}`;
    const ev = await verifyAndParseWebhook(body, sig, secret);
    expect(ev?.id).toBe('evt_1');
  });

  it('rejects a tampered body', async () => {
    const secret = 'whsec_test';
    const body = JSON.stringify({ id: 'evt_1', type: 'x', data: { object: {} } });
    const t = '1700000000';
    const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
    const sig = `t=${t},v1=${v1}`;
    const tampered = body.replace('evt_1', 'evt_2');
    const ev = await verifyAndParseWebhook(tampered, sig, secret);
    expect(ev).toBeNull();
  });

  it('rejects a malformed signature header (missing v1)', async () => {
    const ev = await verifyAndParseWebhook('{}', 't=123', 'whsec_x');
    expect(ev).toBeNull();
  });

  it('rejects when v1 length differs from expected', async () => {
    const ev = await verifyAndParseWebhook('{}', 't=123,v1=short', 'whsec_x');
    expect(ev).toBeNull();
  });
});
