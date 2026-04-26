/**
 * Tests for the lazy-loaded Resend wrapper. We inject a fake constructor so
 * no network is touched and `pnpm install` doesn't need the real package.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDomain, listDomains, setResendImpl } from '../src/lib/resend';
import { setLogger } from '../src/lib/ui';

describe('resend wrapper', () => {
  afterEach(() => {
    setResendImpl(null);
  });

  it('createDomain returns the domain on success', async () => {
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    const fakeResend = function (_apiKey: string): unknown {
      return {
        domains: {
          create: async () => ({
            data: {
              id: 'd_1',
              name: 'tinybooth.com',
              status: 'pending',
              records: [{ type: 'TXT', name: '_resend', value: 'verify=abc' }],
            },
            error: null,
          }),
          get: async () => ({ data: null, error: null }),
          list: async () => ({ data: { data: [] }, error: null }),
        },
      };
    } as unknown as Parameters<typeof setResendImpl>[0];
    setResendImpl(fakeResend);
    const domain = await createDomain('re_x', 'tinybooth.com');
    expect(domain.id).toBe('d_1');
    expect(domain.records).toHaveLength(1);
  });

  it('createDomain throws on Resend error', async () => {
    const fakeResend = function (_apiKey: string): unknown {
      return {
        domains: {
          create: async () => ({ data: null, error: { message: 'bad' } }),
          get: async () => ({ data: null, error: null }),
          list: async () => ({ data: { data: [] }, error: null }),
        },
      };
    } as unknown as Parameters<typeof setResendImpl>[0];
    setResendImpl(fakeResend);
    await expect(createDomain('re_x', 'tinybooth.com')).rejects.toThrow(/bad/);
  });

  it('listDomains returns the list', async () => {
    const fakeResend = function (_apiKey: string): unknown {
      return {
        domains: {
          create: async () => ({ data: null, error: null }),
          get: async () => ({ data: null, error: null }),
          list: async () => ({
            data: { data: [{ id: 'd_1', name: 'tinybooth.com', status: 'verified', records: [] }] },
            error: null,
          }),
        },
      };
    } as unknown as Parameters<typeof setResendImpl>[0];
    setResendImpl(fakeResend);
    const domains = await listDomains('re_x');
    expect(domains[0]?.name).toBe('tinybooth.com');
  });
});
