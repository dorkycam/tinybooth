/**
 * Resend HTTP client. Lazy-loaded so `pnpm install` of `@tinybooth/cli` does
 * not pull `resend` until a command needs it. Matches the lazy-import pattern
 * in `apps/web/src/lib/email.ts`.
 *
 * We use the HTTP SDK (not a CLI) because Resend has no first-class CLI for
 * domain management.
 */

/** Subset of the Resend domain shape we read in `setup`. */
export interface ResendDomain {
  /** Resend's internal id for the domain. */
  id: string;
  /** The domain name. */
  name: string;
  /** Verification status. */
  status: string;
  /** DNS records the user must add to their zone. */
  records: ResendDnsRecord[];
}

/** Single DNS record returned by Resend. */
export interface ResendDnsRecord {
  /** Record type (TXT / MX / CNAME). */
  type: string;
  /** Record name. */
  name: string;
  /** Record value. */
  value: string;
  /** TTL in seconds. */
  ttl?: number;
  /** Verification status of this single record. */
  status?: string;
}

/** Lazy-loaded Resend SDK. */
type ResendCtor = new (apiKey: string) => {
  domains: {
    create: (body: { name: string }) => Promise<{ data: ResendDomain | null; error: unknown }>;
    get: (id: string) => Promise<{ data: ResendDomain | null; error: unknown }>;
    list: () => Promise<{ data: { data: ResendDomain[] } | null; error: unknown }>;
  };
};

let cachedResend: ResendCtor | null = null;

/** Lazy-load the Resend SDK on first use. */
async function getResend(): Promise<ResendCtor> {
  if (cachedResend !== null) return cachedResend;
  // The `resend` SDK is not a dev dep of this package on purpose; consumers
  // install it where they need it (apps/web). We import it dynamically and
  // cast through unknown so tsc does not require its types to be present.
  const mod = (await import(/* @vite-ignore */ 'resend' as string)) as unknown as {
    Resend: ResendCtor;
  };
  cachedResend = mod.Resend;
  return cachedResend;
}

/** Override the Resend SDK constructor (test-only). */
export function setResendImpl(ctor: ResendCtor | null): void {
  cachedResend = ctor;
}

/**
 * Create the domain in Resend. Returns the domain plus its DNS records so
 * the caller can write them into Cloudflare.
 *
 * @param apiKey Resend API key (re_...).
 * @param domain Domain name (e.g. `tinybooth.com`).
 */
export async function createDomain(apiKey: string, domain: string): Promise<ResendDomain> {
  const Resend = await getResend();
  const client = new Resend(apiKey);
  const result = await client.domains.create({ name: domain });
  if (result.error !== null && result.error !== undefined) {
    throw new Error(`Resend createDomain failed: ${JSON.stringify(result.error)}`);
  }
  if (result.data === null) {
    throw new Error('Resend createDomain returned no data');
  }
  return result.data;
}

/** List the domains already on the Resend account. Used for idempotency. */
export async function listDomains(apiKey: string): Promise<ResendDomain[]> {
  const Resend = await getResend();
  const client = new Resend(apiKey);
  const result = await client.domains.list();
  if (result.error !== null && result.error !== undefined) {
    throw new Error(`Resend listDomains failed: ${JSON.stringify(result.error)}`);
  }
  return result.data?.data ?? [];
}
