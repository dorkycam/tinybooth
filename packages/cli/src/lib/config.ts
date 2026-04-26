/**
 * Persistent CLI config stored at `~/.config/tinybooth/config.json`.
 *
 * Holds the artifacts of `setup`: provider auth state, project ids, file
 * paths to credential files. Re-running `setup` reads this so every step is
 * idempotent and a partial run can resume from where it left off.
 *
 * The file is non-secret on purpose. API keys and tokens go in
 * `.env.tinybooth` (project-relative) or in Vercel env, not in this file.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';

/** Shape of the on-disk config. Every field is optional. */
export interface CliConfig {
  /** Vercel team slug or null if personal. */
  vercelTeam?: string;
  /** Vercel project name for `apps/web`. */
  vercelWebProject?: string;
  /** Vercel project name for `apps/wall`. */
  vercelWallProject?: string;
  /** Supabase project ref (the slug from the project URL). */
  supabaseProjectRef?: string;
  /** Cloudflare R2 bucket name. */
  r2Bucket?: string;
  /** Path to the App Store Connect API key (.p8 file). */
  ascApiKeyPath?: string;
  /** Path to the Google Play service account JSON. */
  playServiceAccountPath?: string;
  /** Resend domain we are sending email from. */
  resendDomain?: string;
  /** True once `setup` reached the "Stripe products materialized" step. */
  stripeProductsCreated?: boolean;
  /** True once `setup` finished. */
  completedAt?: string;
}

/** Default location of the config file. Override-able for tests. */
export function defaultConfigPath(): string {
  return resolve(homedir(), '.config', 'tinybooth', 'config.json');
}

/**
 * Load the config from disk. Returns an empty object if the file doesn't
 * exist yet. Throws on read errors that are not ENOENT.
 *
 * @param path Optional override (default: ~/.config/tinybooth/config.json).
 */
export async function loadConfig(path: string = defaultConfigPath()): Promise<CliConfig> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object') return {};
    return parsed as CliConfig;
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'ENOENT') return {};
    throw err;
  }
}

/**
 * Persist the config to disk. Creates the parent directory if needed.
 *
 * @param config Config object to write.
 * @param path Optional override.
 */
export async function saveConfig(
  config: CliConfig,
  path: string = defaultConfigPath(),
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/**
 * Patch the config with a partial update and save it. Returns the merged
 * config so callers can chain it.
 *
 * @param patch Fields to overwrite.
 * @param path Optional override.
 */
export async function patchConfig(
  patch: Partial<CliConfig>,
  path: string = defaultConfigPath(),
): Promise<CliConfig> {
  const current = await loadConfig(path);
  const merged: CliConfig = { ...current, ...patch };
  await saveConfig(merged, path);
  return merged;
}
