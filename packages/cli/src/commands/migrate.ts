/**
 * `tinybooth migrate` -- run Prisma migrations against the active database.
 *
 *   - Default: `prisma migrate deploy` (apply pending migrations).
 *   - `--check`: `prisma migrate diff --exit-code`. Exits non-zero if there
 *     are unapplied migrations. Used in CI as a guard.
 */
import { resolve } from 'node:path';
import * as supa from '../lib/supabase.js';
import { error, info, success } from '../lib/ui.js';

/** Flags accepted by `tinybooth migrate`. */
export interface MigrateFlags {
  /** Repo root for resolving apps/web (where prisma lives). */
  repoRoot: string;
  /** When true, only diff. Don't apply. */
  check?: boolean;
  /** When true, log without executing. */
  dryRun?: boolean;
}

/** Run the migrate command. Returns the process exit code. */
export async function migrate(flags: MigrateFlags): Promise<number> {
  const dryRun = flags.dryRun === true;
  const databaseUrl = process.env.DATABASE_URL ?? '';
  const webApp = resolve(flags.repoRoot, 'apps/web');
  if (databaseUrl.length === 0 && !dryRun) {
    error('DATABASE_URL is not set. Export it before running migrate.');
    return 1;
  }

  if (flags.check === true) {
    info('Checking for unapplied migrations.');
    const upToDate = await supa.prismaDiff(webApp, databaseUrl, dryRun);
    if (upToDate) {
      success('Schema is up to date.');
      return 0;
    }
    error('There are unapplied migrations. Run: tinybooth migrate');
    return 1;
  }

  info('Applying pending migrations to the production DB.');
  await supa.prismaDeploy(webApp, databaseUrl, dryRun);
  success(dryRun ? 'DRY RUN done.' : 'Migrations applied.');
  return 0;
}
