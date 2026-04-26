/**
 * `wrangler` CLI wrapper for Cloudflare R2 + DNS. Wrangler is the supported
 * tool for both. We never reach for the Cloudflare HTTP API here because
 * wrangler already handles auth, retries, and account scoping.
 */
import { run, runOk } from './shell.js';

/** Whether `wrangler whoami` reports a logged-in account. */
export async function isLoggedIn(): Promise<boolean> {
  return runOk('wrangler', ['whoami']);
}

/** Spawn `wrangler login` interactively. */
export async function login(dryRun: boolean): Promise<void> {
  await run('wrangler', ['login'], { stdio: 'inherit', dryRun });
}

/** List buckets visible to the current account. */
export async function listBuckets(dryRun: boolean): Promise<string> {
  const result = await run('wrangler', ['r2', 'bucket', 'list'], { dryRun });
  return result.stdout;
}

/** Create an R2 bucket. Idempotent at the wrangler level (errors on existing). */
export async function createBucket(name: string, dryRun: boolean): Promise<void> {
  await run('wrangler', ['r2', 'bucket', 'create', name], { dryRun });
}

/**
 * Add a DNS record to a Cloudflare zone. Wrangler 4 exposes this via the
 * `wrangler dns_records create` command; we mirror its argument shape so a
 * wrangler upgrade does not break us.
 *
 * @param zone Zone name (e.g. `tinybooth.com`).
 * @param record Record body the CLI accepts on stdin.
 */
export async function addDnsRecord(
  zone: string,
  record: { type: string; name: string; content: string; ttl?: number },
  dryRun: boolean,
): Promise<void> {
  const args = [
    'dns_records',
    'create',
    '--zone',
    zone,
    '--type',
    record.type,
    '--name',
    record.name,
    '--content',
    record.content,
  ];
  if (record.ttl !== undefined) args.push('--ttl', String(record.ttl));
  await run('wrangler', args, { dryRun });
}
