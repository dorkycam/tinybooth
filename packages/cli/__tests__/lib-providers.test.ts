/**
 * Smoke coverage for the provider wrappers (vercel/supabase/eas/cloudflare/
 * stripe/resend/fastlane). Each wrapper just shells out, so the test mocks
 * execa and asserts the right command vector lands on the wire.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as cf from '../src/lib/cloudflare';
import * as eas from '../src/lib/eas';
import * as fastlane from '../src/lib/fastlane';
import { setExecaImpl } from '../src/lib/shell';
import * as stripeLib from '../src/lib/stripe';
import * as supa from '../src/lib/supabase';
import { setLogger } from '../src/lib/ui';
import * as vercel from '../src/lib/vercel';

interface Call {
  file: string;
  args: readonly string[];
  cwd?: string;
  input?: string;
}

describe('provider wrappers', () => {
  let calls: Call[];

  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    setExecaImpl(
      vi.fn(async (file, args, opts) => {
        const o = opts as { cwd?: string; input?: string };
        calls.push({ file, args, cwd: o.cwd, input: o.input });
        return { stdout: '', stderr: '', exitCode: 0 };
      }),
    );
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('vercel: login / link / deploy / logs / envAdd / envRemove / envList', async () => {
    await vercel.login(false);
    await vercel.link('proj', { cwd: '/repo', dryRun: false });
    await vercel.deploy(true, { cwd: '/repo', dryRun: false });
    await vercel.deploy(false, { cwd: '/repo', dryRun: false });
    await vercel.logs('https://x', false, false);
    await vercel.logs('https://x', true, false);
    await vercel.envAdd('K', 'v', 'production', { cwd: '/repo', dryRun: false });
    await vercel.envRemove('K', 'production', { cwd: '/repo', dryRun: false });
    await vercel.envList('production', { cwd: '/repo', dryRun: false });
    expect(calls.length).toBeGreaterThanOrEqual(9);
    expect(calls.find((c) => c.args.includes('--prod'))).toBeDefined();
    expect(calls.find((c) => c.args.includes('--follow'))).toBeDefined();
    expect(calls.find((c) => c.args.includes('rm'))).toBeDefined();
  });

  it('supabase: login / createProject / link / functionLogs', async () => {
    await supa.login(false);
    setExecaImpl(
      vi.fn(async (file, args, opts) => {
        const o = opts as { cwd?: string };
        calls.push({ file, args, cwd: o.cwd });
        return {
          stdout: 'Created a new project xxxxxxxxxxxxxxxxxxxx',
          stderr: '',
          exitCode: 0,
        };
      }),
    );
    const ref = await supa.createProject('test', 'us-west-1', false);
    expect(ref.length).toBeGreaterThan(0);
    await supa.link('xxxxxxxxxxxxxxxxxxxx', '/repo', false);
    await supa.functionLogs(null, false);
    await supa.functionLogs('my-fn', false);
  });

  it('cloudflare: login / listBuckets / createBucket / addDnsRecord', async () => {
    await cf.login(false);
    await cf.listBuckets(false);
    await cf.createBucket('events', false);
    await cf.addDnsRecord(
      'tinybooth.com',
      { type: 'TXT', name: '_resend', content: 'verify=abc', ttl: 60 },
      false,
    );
    expect(calls.find((c) => c.args.includes('bucket'))).toBeDefined();
    expect(calls.find((c) => c.args.includes('dns_records'))).toBeDefined();
  });

  it('eas: login / build / submit / update', async () => {
    await eas.login(false);
    await eas.build('all', 'production', { cwd: '/m', dryRun: false });
    await eas.submit('ios', 'preview', { cwd: '/m', dryRun: false });
    await eas.update('production', 'msg', { cwd: '/m', dryRun: false });
    expect(calls.find((c) => c.args.includes('build'))).toBeDefined();
    expect(calls.find((c) => c.args.includes('submit'))).toBeDefined();
    expect(calls.find((c) => c.args.includes('update'))).toBeDefined();
  });

  it('fastlane: bundleAvailable / runLane / runLegacyBuildAndSubmit', async () => {
    expect(await fastlane.bundleAvailable()).toBe(true);
    await fastlane.runLane('metadata_push', { cwd: '/m', dryRun: false });
    await fastlane.runLegacyBuildAndSubmit('preview', { cwd: '/m', dryRun: false });
    expect(calls.find((c) => c.args.includes('metadata_push'))).toBeDefined();
    expect(calls.find((c) => c.file === './scripts/build-and-submit.sh')).toBeDefined();
  });

  it('stripe: login + createWebhookEndpoint parses the secret', async () => {
    await stripeLib.login(false);
    setExecaImpl(
      vi.fn(async (file, args) => {
        calls.push({ file, args });
        return {
          stdout: JSON.stringify({ secret: 'whsec_test_abc' }),
          stderr: '',
          exitCode: 0,
        };
      }),
    );
    const secret = await stripeLib.createWebhookEndpoint(
      'https://x/webhooks/stripe',
      ['checkout.session.completed'],
      false,
    );
    expect(secret).toBe('whsec_test_abc');
  });

  it('stripe: createWebhookEndpoint returns empty when stripe responds with non-JSON', async () => {
    setExecaImpl(
      vi.fn(async (file, args) => {
        calls.push({ file, args });
        return { stdout: 'not json', stderr: '', exitCode: 0 };
      }),
    );
    const secret = await stripeLib.createWebhookEndpoint(
      'https://x',
      ['checkout.session.completed'],
      false,
    );
    expect(secret).toBe('');
  });

  it('stripe: listProducts + createProductWithPrice via injected SDK', async () => {
    let createdProduct: Record<string, unknown> | null = null;
    let createdPrice: Record<string, unknown> | null = null;
    const fakeStripe = function (_apiKey: string): unknown {
      return {
        products: {
          list: async () => ({ data: [{ id: 'existing', metadata: { product_id: 'event_pass' } }] }),
          create: async (body: Record<string, unknown>) => {
            createdProduct = body;
            return { id: 'prod_x' };
          },
        },
        prices: {
          create: async (body: Record<string, unknown>) => {
            createdPrice = body;
            return { id: 'price_x' };
          },
        },
      };
    } as unknown as Parameters<typeof stripeLib.setStripeImpl>[0];
    stripeLib.setStripeImpl(fakeStripe);
    const products = await stripeLib.listProducts('sk_test_x');
    expect(products[0]?.id).toBe('existing');
    const created = await stripeLib.createProductWithPrice('sk_test_x', {
      id: 'tinybooth_event_pass',
      name: 'Event Pass',
      description: 'desc',
      metadata: { product_id: 'event_pass' },
      priceUsdCents: 1299,
    });
    expect(created).toEqual({ productId: 'prod_x', priceId: 'price_x' });
    expect(createdProduct).toMatchObject({ id: 'tinybooth_event_pass', name: 'Event Pass' });
    expect(createdPrice).toMatchObject({ unit_amount: 1299, currency: 'usd' });
    stripeLib.setStripeImpl(null);
  });
});
