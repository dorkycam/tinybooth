/**
 * `.env`-style file reader / writer plus Vercel env push helpers.
 *
 * The format we read is the standard `KEY=VALUE` per line, with `#` comments
 * and blank lines ignored. Quoted values are unwrapped. We do NOT do shell
 * interpolation; every value is treated as a literal string.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { run } from './shell.js';

/** Parsed env file: ordered keys plus the values keyed by name. */
export interface EnvFile {
  /** Insertion-ordered keys, useful for round-tripping a file. */
  keys: string[];
  /** Map of key -> value. */
  values: Record<string, string>;
}

/**
 * Parse a `.env` file body into an `EnvFile`. Lines starting with `#`,
 * blank lines, and lines without an `=` are skipped.
 *
 * @param body Raw file contents.
 */
export function parseEnv(body: string): EnvFile {
  const keys: string[] = [];
  const values: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex < 0) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const value = stripQuotes(rawValue);
    if (key.length === 0) continue;
    if (!(key in values)) keys.push(key);
    values[key] = value;
  }
  return { keys, values };
}

/** Render an `EnvFile` back to disk-friendly form. Sorted by insertion order. */
export function stringifyEnv(env: EnvFile): string {
  const out: string[] = [];
  for (const key of env.keys) {
    const value = env.values[key] ?? '';
    out.push(`${key}=${needsQuotes(value) ? JSON.stringify(value) : value}`);
  }
  return `${out.join('\n')}\n`;
}

/**
 * Read a `.env` file from disk. Returns an empty `EnvFile` if missing.
 *
 * @param path Absolute path to the file.
 */
export async function readEnvFile(path: string): Promise<EnvFile> {
  try {
    const body = await readFile(path, 'utf8');
    return parseEnv(body);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === 'ENOENT') return { keys: [], values: {} };
    throw err;
  }
}

/** Write an `EnvFile` to disk. Overwrites unconditionally. */
export async function writeEnvFile(path: string, env: EnvFile): Promise<void> {
  await writeFile(path, stringifyEnv(env), 'utf8');
}

/**
 * Compute the set of keys present in `template` but missing or empty in
 * `current`. Used by `env sync` to know which prompts to ask.
 */
export function missingKeys(template: EnvFile, current: EnvFile): string[] {
  const out: string[] = [];
  for (const key of template.keys) {
    const have = current.values[key];
    if (have === undefined || have.length === 0) out.push(key);
  }
  return out;
}

/**
 * Push a single env var to a Vercel project via the `vercel env add` CLI.
 * Honors dry-run.
 *
 * @param key Env var name.
 * @param value Value to store.
 * @param target Vercel target (production / preview / development).
 * @param projectCwd Working directory of the linked Vercel project.
 * @param dryRun Forward to shell wrapper.
 */
export async function vercelEnvAdd(
  key: string,
  value: string,
  target: 'production' | 'preview' | 'development',
  projectCwd: string,
  dryRun: boolean,
): Promise<void> {
  await run('vercel', ['env', 'add', key, target], {
    cwd: projectCwd,
    input: value,
    dryRun,
  });
}

/** Strip a single layer of matched quotes from a value. */
function stripQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

/** Decide whether a value needs to be JSON-quoted on write. */
function needsQuotes(value: string): boolean {
  return /[\s"'#]/.test(value);
}
