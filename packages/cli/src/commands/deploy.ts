/**
 * `tinybooth deploy` -- ship `apps/web` and `apps/wall` to Vercel.
 *
 * Order of operations:
 *   1. Run `pnpm turbo run lint typecheck test build` so we never deploy red.
 *   2. `vercel deploy [--prod]` against `apps/web`.
 *   3. Same for `apps/wall`.
 *   4. Print resulting URLs.
 */
import { resolve } from 'node:path';
import { run } from '../lib/shell.js';
import { info, plain, step, success } from '../lib/ui.js';
import * as vercel from '../lib/vercel.js';

/** Flags accepted by `tinybooth deploy`. */
export interface DeployFlags {
  /** When true, deploy to a preview alias instead of production. */
  staging?: boolean;
  /** When true, log every command without executing. */
  dryRun?: boolean;
  /** Repo root used to resolve apps/web and apps/wall. */
  repoRoot: string;
  /** When true, skip the pre-deploy quality gate. */
  skipQuality?: boolean;
}

/** Run the deploy command. Returns the process exit code. */
export async function deploy(flags: DeployFlags): Promise<number> {
  const dryRun = flags.dryRun === true;
  const production = flags.staging !== true;

  if (dryRun) info('Running deploy in DRY RUN mode.');
  info(production ? 'Deploying to PRODUCTION.' : 'Deploying to STAGING (preview alias).');

  if (flags.skipQuality !== true) {
    step(1, 3, 'Quality gate: turbo run lint typecheck test build');
    await run('pnpm', ['turbo', 'run', 'lint', 'typecheck', 'test', 'build'], {
      cwd: flags.repoRoot,
      stdio: 'inherit',
      dryRun,
    });
    success('Quality gate passed.');
  }

  step(2, 3, 'Deploy apps/web');
  const webUrl = await vercel.deploy(production, {
    cwd: resolve(flags.repoRoot, 'apps/web'),
    dryRun,
  });
  if (webUrl.length > 0) success(`web deployed: ${webUrl}`);

  step(3, 3, 'Deploy apps/wall');
  const wallUrl = await vercel.deploy(production, {
    cwd: resolve(flags.repoRoot, 'apps/wall'),
    dryRun,
  });
  if (wallUrl.length > 0) success(`wall deployed: ${wallUrl}`);

  plain('');
  if (dryRun) info('DRY RUN done. Run without --dry-run to ship for real.');
  else success('Both projects deployed.');
  return 0;
}
