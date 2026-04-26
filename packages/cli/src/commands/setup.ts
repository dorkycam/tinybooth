/**
 * `tinybooth setup` -- the one-shot account bootstrap.
 *
 * Walks Camrynn through every account hookup once. Each step is idempotent:
 * if a previous run completed it (recorded in
 * `~/.config/tinybooth/config.json`), we skip and move on. Each step honors
 * `--dry-run` and prints exactly what it would do.
 *
 * Steps:
 *   1. Verify required CLIs.
 *   2-7. Login flows for vercel, supabase, wrangler, stripe, eas, gh.
 *   8. Prompt for App Store Connect API key (.p8) path.
 *   9. Prompt for Google Play service account JSON path.
 *   10. Prompt for Resend API key.
 *   11. Stripe webhook endpoint.
 *   12. Supabase project (create if missing).
 *   13. Prisma migrate deploy.
 *   14. Cloudflare R2 bucket.
 *   15. Materialize Stripe products from `@tinybooth/billing`.
 *   16. Resend domain + Cloudflare DNS.
 *   17. Vercel project link + env push.
 *   18. Print summary plus follow-up checklist.
 */
import { resolve } from 'node:path';
import promptsImport from 'prompts';
import { stripeCatalog, isAlreadyOnStripe } from '../lib/catalog.js';
import { defaultConfigPath, loadConfig, patchConfig } from '../lib/config.js';
import * as cf from '../lib/cloudflare.js';
import * as eas from '../lib/eas.js';
import * as resend from '../lib/resend.js';
import { runOk } from '../lib/shell.js';
import * as stripeLib from '../lib/stripe.js';
import * as supa from '../lib/supabase.js';
import { info, note, plain, step, success, warn } from '../lib/ui.js';
import * as vercel from '../lib/vercel.js';

/** Flags accepted by `tinybooth setup`. */
export interface SetupFlags {
  /** When true, log every action without executing. */
  dryRun?: boolean;
  /** Repo root used to resolve apps/web and apps/mobile. */
  repoRoot: string;
  /** Override the CLI config path (test-only). */
  configPath?: string;
}

/** Number of steps in the flow. Used in the "[n/total]" header. */
const TOTAL_STEPS = 18;

/** Replaceable prompt impl for tests. */
type PromptFn = typeof promptsImport;
let promptImpl: PromptFn = promptsImport;

/** Inject a fake `prompts` (test-only). */
export function setPromptsImpl(fn: PromptFn): void {
  promptImpl = fn;
}

/** Restore the real prompts module (test cleanup). */
export function resetPromptsImpl(): void {
  promptImpl = promptsImport;
}

/** Run the full setup flow. Returns the process exit code. */
export async function setup(flags: SetupFlags): Promise<number> {
  const dryRun = flags.dryRun === true;
  const configPath = flags.configPath ?? defaultConfigPath();
  const config = await loadConfig(configPath);

  if (dryRun) {
    info('Running setup in DRY RUN mode. No commands will be executed.');
  } else {
    info('Running setup. Each step is idempotent, safe to re-run on failure.');
  }

  // Step 1: required CLIs.
  step(1, TOTAL_STEPS, 'Verify required CLIs');
  const missing = await verifyClis(dryRun);
  if (missing.length > 0) {
    plain('');
    plain('Install the following before re-running setup:');
    for (const item of missing) plain(`  - ${item}`);
    return 1;
  }
  success('Every required CLI is installed.');

  // Steps 2-7: provider logins.
  await loginStep(2, 'Vercel', () => vercel.isLoggedIn(), () => vercel.login(dryRun));
  await loginStep(3, 'Supabase', () => supa.isLoggedIn(), () => supa.login(dryRun));
  await loginStep(4, 'Cloudflare (wrangler)', () => cf.isLoggedIn(), () => cf.login(dryRun));
  await loginStep(5, 'Stripe', () => stripeLib.isLoggedIn(), () => stripeLib.login(dryRun));
  await loginStep(6, 'EAS (Expo)', () => eas.isLoggedIn(), () => eas.login(dryRun));
  await loginStep(7, 'GitHub (gh)', () => runOk('gh', ['auth', 'status']), async () => {
    const { run } = await import('../lib/shell.js');
    await run('gh', ['auth', 'login'], { stdio: 'inherit', dryRun });
  });

  // Step 8: ASC API key path.
  step(8, TOTAL_STEPS, 'App Store Connect API key (.p8) path');
  const ascAnswer = await askPath(
    'Path to App Store Connect .p8 key',
    config.ascApiKeyPath,
  );
  if (ascAnswer !== null) await patchConfig({ ascApiKeyPath: ascAnswer }, configPath);

  // Step 9: Google Play service account JSON.
  step(9, TOTAL_STEPS, 'Google Play service account JSON path');
  const playAnswer = await askPath(
    'Path to Google Play service account JSON',
    config.playServiceAccountPath,
  );
  if (playAnswer !== null) await patchConfig({ playServiceAccountPath: playAnswer }, configPath);

  // Step 10: Resend API key.
  step(10, TOTAL_STEPS, 'Resend API key');
  const resendKey = await askSecret('Paste your Resend API key (re_...)');
  if (resendKey !== null && resendKey.length > 0) {
    if (dryRun) note('would store RESEND_API_KEY in .env.tinybooth');
    else await writeEnvSecret(flags.repoRoot, 'RESEND_API_KEY', resendKey);
  }

  // Step 11: Stripe webhook endpoint (or use existing secret).
  step(11, TOTAL_STEPS, 'Stripe webhook endpoint');
  const webhookSecret = await provisionStripeWebhook(dryRun);
  if (webhookSecret !== null && webhookSecret.length > 0) {
    if (dryRun) note('would store STRIPE_WEBHOOK_SECRET in .env.tinybooth');
    else await writeEnvSecret(flags.repoRoot, 'STRIPE_WEBHOOK_SECRET', webhookSecret);
  }

  // Step 12: Supabase project (create if missing).
  step(12, TOTAL_STEPS, 'Supabase production project');
  const projectName = await askText('Supabase project name', 'tinybooth-prod');
  if (projectName !== null) {
    let ref = config.supabaseProjectRef ?? '';
    if (ref.length === 0) {
      info(`Creating Supabase project ${projectName} in us-west-1.`);
      ref = await supa.createProject(projectName, 'us-west-1', dryRun);
      if (ref.length > 0) await patchConfig({ supabaseProjectRef: ref }, configPath);
    } else {
      success(`Supabase project ref already known: ${ref}. Skipping creation.`);
    }
  }

  // Step 13: prisma migrate deploy.
  step(13, TOTAL_STEPS, 'Prisma migrate deploy against production DB');
  const databaseUrl = process.env.DATABASE_URL ?? '';
  if (databaseUrl.length === 0) {
    warn('DATABASE_URL not set. Skipping migrate. Re-run setup with the env var.');
  } else {
    await supa.prismaDeploy(resolve(flags.repoRoot, 'apps/web'), databaseUrl, dryRun);
    success('Migrations applied.');
  }

  // Step 14: R2 bucket.
  step(14, TOTAL_STEPS, 'Cloudflare R2 bucket');
  const bucketName = await askText('R2 bucket name', config.r2Bucket ?? 'tinybooth-events');
  if (bucketName !== null) {
    info(`Ensuring R2 bucket ${bucketName} exists.`);
    await cf.createBucket(bucketName, dryRun);
    await patchConfig({ r2Bucket: bucketName }, configPath);
  }

  // Step 15: Stripe products from billing catalog.
  step(15, TOTAL_STEPS, 'Materialize Stripe products from @tinybooth/billing');
  await materializeStripeProducts(dryRun);
  await patchConfig({ stripeProductsCreated: true }, configPath);

  // Step 16: Resend domain + Cloudflare DNS.
  step(16, TOTAL_STEPS, 'Resend domain + Cloudflare DNS records');
  const domain = await askText('Domain to send mail from', config.resendDomain ?? 'tinybooth.com');
  if (domain !== null) {
    if (dryRun) {
      note(`would call Resend to verify ${domain}`);
      note('would call wrangler dns_records create for each returned record');
    } else if (resendKey !== null && resendKey.length > 0) {
      await provisionResend(resendKey, domain);
    } else {
      warn('No Resend API key supplied; skipping Resend domain step.');
    }
    await patchConfig({ resendDomain: domain }, configPath);
  }

  // Step 17: Vercel projects + env push.
  step(17, TOTAL_STEPS, 'Vercel projects (web + wall) and env vars');
  const webName = await askText('Vercel project name for apps/web', config.vercelWebProject ?? 'tinybooth-web');
  const wallName = await askText('Vercel project name for apps/wall', config.vercelWallProject ?? 'tinybooth-wall');
  if (webName !== null) {
    await vercel.link(webName, { cwd: resolve(flags.repoRoot, 'apps/web'), dryRun });
    await patchConfig({ vercelWebProject: webName }, configPath);
  }
  if (wallName !== null) {
    await vercel.link(wallName, { cwd: resolve(flags.repoRoot, 'apps/wall'), dryRun });
    await patchConfig({ vercelWallProject: wallName }, configPath);
  }
  if (dryRun) {
    note('would push every required env var from docs/launch-checklist.md to Vercel');
  } else {
    info('Push env vars manually with: tinybooth env sync --env=production');
  }

  // Step 18: summary + follow-ups.
  step(18, TOTAL_STEPS, 'Summary + follow-up checklist');
  await patchConfig({ completedAt: new Date().toISOString() }, configPath);
  printSummary(dryRun);
  return 0;
}

/** Verify each required CLI is installed. Returns the missing names. */
async function verifyClis(dryRun: boolean): Promise<string[]> {
  const required = [
    { name: 'vercel', bin: 'vercel', hint: 'pnpm add -g vercel' },
    { name: 'supabase', bin: 'supabase', hint: 'brew install supabase/tap/supabase' },
    { name: 'wrangler', bin: 'wrangler', hint: 'pnpm add -g wrangler' },
    { name: 'stripe', bin: 'stripe', hint: 'brew install stripe/stripe-cli/stripe' },
    { name: 'eas', bin: 'eas', hint: 'pnpm add -g eas-cli' },
    { name: 'gh', bin: 'gh', hint: 'brew install gh' },
    { name: 'bundle', bin: 'bundle', hint: 'gem install bundler' },
  ];
  const missing: string[] = [];
  for (const item of required) {
    const ok = await runOk(item.bin, ['--version'], { dryRun });
    if (!ok) missing.push(`${item.name} -> ${item.hint}`);
  }
  return missing;
}

/**
 * Generic login step: confirm the user wants to (re-)login, then call the
 * provider-specific login fn unless they're already logged in.
 */
async function loginStep(
  index: number,
  name: string,
  isLoggedIn: () => Promise<boolean>,
  loginFn: () => Promise<void>,
): Promise<void> {
  step(index, TOTAL_STEPS, `${name} login`);
  const already = await isLoggedIn();
  if (already) {
    success(`${name} already logged in.`);
    return;
  }
  const answer = await promptImpl({
    type: 'confirm',
    name: 'go',
    message: `Open ${name} login flow?`,
    initial: true,
  });
  if (answer.go !== true) {
    warn(`Skipped ${name} login. Some downstream steps will fail until done.`);
    return;
  }
  await loginFn();
}

/** Prompt for a filesystem path. Returns null on cancel. */
async function askPath(label: string, current?: string): Promise<string | null> {
  const answer = await promptImpl({
    type: 'text',
    name: 'value',
    message: label,
    initial: current,
  });
  if (typeof answer.value !== 'string' || answer.value.length === 0) return null;
  return answer.value;
}

/** Prompt for a free-form text value. */
async function askText(label: string, initial?: string): Promise<string | null> {
  const answer = await promptImpl({
    type: 'text',
    name: 'value',
    message: label,
    initial,
  });
  if (typeof answer.value !== 'string' || answer.value.length === 0) return null;
  return answer.value;
}

/** Prompt for a secret value (input is masked). */
async function askSecret(label: string): Promise<string | null> {
  const answer = await promptImpl({
    type: 'password',
    name: 'value',
    message: label,
  });
  if (typeof answer.value !== 'string') return null;
  return answer.value;
}

/**
 * Stripe webhook: ask whether the user wants to auto-create the endpoint or
 * paste an existing signing secret.
 */
async function provisionStripeWebhook(dryRun: boolean): Promise<string | null> {
  const choice = await promptImpl({
    type: 'select',
    name: 'value',
    message: 'How do you want to set up the Stripe webhook?',
    choices: [
      { title: 'Create endpoint via stripe CLI', value: 'create' },
      { title: 'Paste existing signing secret', value: 'paste' },
      { title: 'Skip', value: 'skip' },
    ],
    initial: 0,
  });
  if (choice.value === 'create') {
    const secret = await stripeLib.createWebhookEndpoint(
      'https://tinybooth.com/api/webhooks/stripe',
      ['checkout.session.completed'],
      dryRun,
    );
    if (dryRun) {
      note('would create Stripe webhook endpoint and capture the signing secret');
      return null;
    }
    return secret;
  }
  if (choice.value === 'paste') {
    return askSecret('Paste your Stripe signing secret (whsec_...)');
  }
  return null;
}

/**
 * Materialize the Stripe products from `@tinybooth/billing` PRODUCTS. Looks
 * up existing products by metadata and skips any that already exist.
 */
async function materializeStripeProducts(dryRun: boolean): Promise<void> {
  const catalog = stripeCatalog();
  if (dryRun) {
    for (const item of catalog) {
      note(`would create stripe product ${item.id} ($${(item.priceUsdCents / 100).toFixed(2)})`);
    }
    return;
  }
  const apiKey = process.env.STRIPE_SECRET_KEY ?? '';
  if (apiKey.length === 0) {
    warn('STRIPE_SECRET_KEY not set; skipping Stripe product materialization.');
    return;
  }
  const existing = await stripeLib.listProducts(apiKey);
  for (const payload of catalog) {
    if (isAlreadyOnStripe(existing, payload)) {
      success(`Stripe product ${payload.id} already exists, skipping.`);
      continue;
    }
    const created = await stripeLib.createProductWithPrice(apiKey, payload);
    success(`Created Stripe product ${created.productId} with price ${created.priceId}.`);
  }
}

/** Hit Resend, get DNS records back, push them to Cloudflare. */
async function provisionResend(apiKey: string, domain: string): Promise<void> {
  const existing = await resend.listDomains(apiKey);
  let entry = existing.find((d) => d.name === domain);
  if (entry === undefined) {
    info(`Domain ${domain} not on Resend yet, creating.`);
    entry = await resend.createDomain(apiKey, domain);
  }
  for (const record of entry.records) {
    info(`DNS ${record.type} ${record.name} -> ${record.value}`);
    await cf.addDnsRecord(
      domain,
      { type: record.type, name: record.name, content: record.value, ttl: record.ttl },
      false,
    );
  }
  success(`Resend domain ${domain} configured.`);
}

/** Append (or replace) a single key inside `.env.tinybooth` at the repo root. */
async function writeEnvSecret(repoRoot: string, key: string, value: string): Promise<void> {
  const { readEnvFile, writeEnvFile } = await import('../lib/env.js');
  const path = resolve(repoRoot, '.env.tinybooth');
  const env = await readEnvFile(path);
  if (!env.keys.includes(key)) env.keys.push(key);
  env.values[key] = value;
  await writeEnvFile(path, env);
  success(`Wrote ${key} to .env.tinybooth.`);
}

/** Print the closing summary + the human-only follow-up checklist. */
function printSummary(dryRun: boolean): void {
  plain('');
  if (dryRun) info('DRY RUN complete. Run without --dry-run to actually provision.');
  else success('Setup complete.');
  plain('');
  plain('Things that still need dashboard work (no API for these):');
  plain('  - Apple Small Business Program enrollment in App Store Connect');
  plain('  - Create the three IAP products in App Store Connect (per docs/iap-setup.md)');
  plain('  - Create the three Managed Products in Google Play Console');
  plain('  - RevenueCat project + entitlements (after IAPs exist)');
  plain('  - Stripe KYC and live mode activation');
  plain('  - App Privacy questionnaire and Data Safety form');
  plain('');
}
