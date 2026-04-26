/**
 * `tinybooth env <get|set|list|sync>` -- thin wrapper over `vercel env` plus
 * a `sync` mode that diffs `.env.production.example` against the current
 * Vercel state and prompts for any missing values.
 */
import { resolve } from 'node:path';
import promptsImport from 'prompts';
import { missingKeys, readEnvFile, vercelEnvAdd } from '../lib/env.js';
import { run } from '../lib/shell.js';
import { error, info, note, success, warn } from '../lib/ui.js';
import * as vercel from '../lib/vercel.js';

/** Subcommands accepted by `tinybooth env`. */
export type EnvAction = 'get' | 'set' | 'list' | 'sync';

/** Vercel env target. */
export type EnvTarget = 'production' | 'preview' | 'development';

/** Flags accepted by `tinybooth env`. */
export interface EnvFlags {
  /** Subcommand. */
  action: EnvAction;
  /** Vercel target. */
  target: EnvTarget;
  /** Optional key (for get / set). */
  key?: string;
  /** Optional value (for set). */
  value?: string;
  /** App folder under the repo root. Default: apps/web. */
  app?: string;
  /** Repo root. */
  repoRoot: string;
  /** When true, log without executing. */
  dryRun?: boolean;
  /** Path to the example file used by `sync`. */
  examplePath?: string;
}

/** Replaceable prompts impl for tests. */
type PromptFn = typeof promptsImport;
let promptImpl: PromptFn = promptsImport;

/** Inject a fake `prompts` (test-only). */
export function setPromptsImpl(fn: PromptFn): void {
  promptImpl = fn;
}

/** Run the env command. */
export async function envCommand(flags: EnvFlags): Promise<number> {
  const cwd = resolve(flags.repoRoot, flags.app ?? 'apps/web');
  const dryRun = flags.dryRun === true;

  switch (flags.action) {
    case 'list': {
      const out = await vercel.envList(flags.target, { cwd, dryRun });
      if (!dryRun) info(out);
      return 0;
    }
    case 'get': {
      if (flags.key === undefined) {
        error('env get requires a key');
        return 1;
      }
      // Vercel's CLI does not expose a single-key get; we list and grep.
      const out = await vercel.envList(flags.target, { cwd, dryRun });
      if (dryRun) return 0;
      const line = out.split(/\r?\n/).find((row) => row.startsWith(flags.key ?? ''));
      info(line ?? `(no value for ${flags.key})`);
      return 0;
    }
    case 'set': {
      if (flags.key === undefined || flags.value === undefined) {
        error('env set requires a key and a value');
        return 1;
      }
      await vercelEnvAdd(flags.key, flags.value, flags.target, cwd, dryRun);
      success(`Set ${flags.key} on ${flags.target}.`);
      return 0;
    }
    case 'sync': {
      const examplePath = flags.examplePath ?? resolve(cwd, '.env.production.example');
      info(`Diffing Vercel env against ${examplePath}.`);
      const example = await readEnvFile(examplePath);
      const currentText = await vercel.envList(flags.target, { cwd, dryRun });
      const current = parseVercelList(currentText);
      const need = missingKeys(example, current);
      if (need.length === 0) {
        success('Vercel env already has every key from the example.');
        return 0;
      }
      info(`Missing ${need.length} keys: ${need.join(', ')}`);
      for (const key of need) {
        if (dryRun) {
          note(`would prompt for ${key} and run vercel env add ${key} ${flags.target}`);
          continue;
        }
        const answer = await promptImpl({
          type: 'password',
          name: 'value',
          message: `Value for ${key}`,
        });
        const value = typeof answer.value === 'string' ? answer.value : '';
        if (value.length === 0) {
          warn(`Skipped ${key} (empty value).`);
          continue;
        }
        await vercelEnvAdd(key, value, flags.target, cwd, dryRun);
        success(`Set ${key}.`);
      }
      return 0;
    }
  }
}

/**
 * Parse the text output of `vercel env ls`. Vercel's output starts with a
 * header table; we treat the first whitespace-separated token of every row
 * as the key.
 */
function parseVercelList(out: string): { keys: string[]; values: Record<string, string> } {
  const keys: string[] = [];
  const values: Record<string, string> = {};
  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (/^name\s/i.test(trimmed)) continue;
    const first = trimmed.split(/\s+/)[0] ?? '';
    if (first.length === 0) continue;
    if (!keys.includes(first)) keys.push(first);
    values[first] = '<set>';
  }
  return { keys, values };
}

/** Internal helper exposed for tests. */
export const __test__ = { parseVercelList };

/** Wrapper to keep the unused-import lint quiet for `run` (used elsewhere). */
export const __noop = run;
