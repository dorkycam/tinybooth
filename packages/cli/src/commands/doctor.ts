/**
 * `tinybooth doctor` -- non-destructive readiness check.
 *
 * Verifies every required CLI is on PATH, reports auth status for each
 * provider, and prints which entries in `~/.config/tinybooth/config.json`
 * are missing. Exits non-zero if anything required is missing.
 */
import { defaultConfigPath, loadConfig } from '../lib/config.js';
import { runOk } from '../lib/shell.js';
import { error, info, success, warn } from '../lib/ui.js';

/** Flags accepted by the doctor command. */
export interface DoctorFlags {
  /** Run in dry-run mode (still does the checks but never spawns logins). */
  dryRun?: boolean;
  /** Override the config path (test-only). */
  configPath?: string;
}

/** A single CLI check row. */
interface CliCheck {
  /** Display name. */
  name: string;
  /** Executable to spawn for the install probe. */
  bin: string;
  /** Arguments for the install probe. */
  installArgs: readonly string[];
  /** Probe to test auth. Null if "installed" is enough. */
  auth: { args: readonly string[] } | null;
  /** Hint shown when the install probe fails. */
  installHint: string;
}

const CHECKS: readonly CliCheck[] = [
  {
    name: 'vercel',
    bin: 'vercel',
    installArgs: ['--version'],
    auth: { args: ['whoami'] },
    installHint: 'pnpm add -g vercel',
  },
  {
    name: 'supabase',
    bin: 'supabase',
    installArgs: ['--version'],
    auth: { args: ['projects', 'list'] },
    installHint: 'brew install supabase/tap/supabase',
  },
  {
    name: 'wrangler',
    bin: 'wrangler',
    installArgs: ['--version'],
    auth: { args: ['whoami'] },
    installHint: 'pnpm add -g wrangler',
  },
  {
    name: 'stripe',
    bin: 'stripe',
    installArgs: ['--version'],
    auth: { args: ['config', '--list'] },
    installHint: 'brew install stripe/stripe-cli/stripe',
  },
  {
    name: 'eas',
    bin: 'eas',
    installArgs: ['--version'],
    auth: { args: ['whoami'] },
    installHint: 'pnpm add -g eas-cli',
  },
  {
    name: 'gh',
    bin: 'gh',
    installArgs: ['--version'],
    auth: { args: ['auth', 'status'] },
    installHint: 'brew install gh',
  },
  {
    name: 'bundle (fastlane)',
    bin: 'bundle',
    installArgs: ['--version'],
    auth: null,
    installHint: 'gem install bundler && (cd apps/mobile && bundle install)',
  },
];

/** Required config keys that `setup` is expected to populate. */
const REQUIRED_CONFIG_KEYS: ReadonlyArray<keyof Awaited<ReturnType<typeof loadConfig>>> = [
  'vercelWebProject',
  'vercelWallProject',
  'supabaseProjectRef',
  'r2Bucket',
  'ascApiKeyPath',
  'playServiceAccountPath',
];

/**
 * Run the doctor command.
 *
 * @param flags Parsed CLI flags.
 * @returns Process exit code (0 = healthy).
 */
export async function doctor(flags: DoctorFlags = {}): Promise<number> {
  info('Checking required CLIs and credentials.');
  let healthy = true;

  for (const check of CHECKS) {
    const installed = await runOk(check.bin, check.installArgs, { dryRun: flags.dryRun });
    if (!installed) {
      error(`${check.name} not installed. Try: ${check.installHint}`);
      healthy = false;
      continue;
    }
    if (check.auth === null) {
      success(`${check.name} installed`);
      continue;
    }
    const authed = await runOk(check.bin, check.auth.args, { dryRun: flags.dryRun });
    if (authed) success(`${check.name} installed and logged in`);
    else {
      warn(`${check.name} installed but not logged in. Run: tinybooth setup`);
      healthy = false;
    }
  }

  const config = await loadConfig(flags.configPath ?? defaultConfigPath());
  const missing = REQUIRED_CONFIG_KEYS.filter((key) => config[key] === undefined);
  if (missing.length === 0) {
    success('Local config has every required key');
  } else {
    warn(`Local config is missing: ${missing.join(', ')}. Run: tinybooth setup`);
    healthy = false;
  }

  if (healthy) success('Doctor passed. You are ready to deploy.');
  else error('Doctor found issues. Fix the warnings above and re-run.');

  return healthy ? 0 : 1;
}
