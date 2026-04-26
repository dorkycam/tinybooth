/**
 * `tinybooth logs` -- tail logs from Vercel and Supabase. The `--service`
 * flag picks which provider to read from; `--tail` follows the live stream.
 */
import { error, info } from '../lib/ui.js';
import * as supa from '../lib/supabase.js';
import * as vercel from '../lib/vercel.js';

/** Services we know how to read logs from. */
export type LogsService = 'web' | 'wall' | 'supabase';

/** Flags accepted by `tinybooth logs`. */
export interface LogsFlags {
  /** Which provider to read from. */
  service: LogsService;
  /** Specific deployment URL for Vercel. Falls back to the latest prod URL. */
  deploymentUrl?: string;
  /** Specific edge function name for Supabase. */
  functionName?: string;
  /** Tail / follow the live stream. */
  tail?: boolean;
  /** When true, log without executing. */
  dryRun?: boolean;
}

/** Run the logs command. */
export async function logs(flags: LogsFlags): Promise<number> {
  const dryRun = flags.dryRun === true;
  const follow = flags.tail === true;

  if (flags.service === 'supabase') {
    info('Tailing Supabase Edge Function logs.');
    await supa.functionLogs(flags.functionName ?? null, dryRun);
    return 0;
  }

  if (flags.service === 'web' || flags.service === 'wall') {
    const url = flags.deploymentUrl ?? `https://${flags.service}.tinybooth.com`;
    info(`Tailing Vercel logs for ${url}.`);
    await vercel.logs(url, follow, dryRun);
    return 0;
  }

  error(`Unknown service: ${String(flags.service)}`);
  return 1;
}
