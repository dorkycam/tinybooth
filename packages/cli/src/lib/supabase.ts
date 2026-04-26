/**
 * `supabase` CLI wrapper. The Supabase CLI handles project linking, db
 * migrations, and edge-function logs. We never embed `@supabase/supabase-js`
 * here because the CLI is the user-facing surface and the SDK is for the
 * apps.
 */
import { run, runOk } from './shell.js';

/** Whether the Supabase CLI reports a logged-in user. */
export async function isLoggedIn(): Promise<boolean> {
  return runOk('supabase', ['projects', 'list']);
}

/** Spawn `supabase login` interactively. */
export async function login(dryRun: boolean): Promise<void> {
  await run('supabase', ['login'], { stdio: 'inherit', dryRun });
}

/** Create a new Supabase project. Returns the new project ref on success. */
export async function createProject(
  name: string,
  region: string,
  dryRun: boolean,
): Promise<string> {
  const result = await run(
    'supabase',
    ['projects', 'create', name, '--region', region, '--interactive=false'],
    { dryRun },
  );
  // CLI prints "Created a new project <ref>". Fall back to empty under dry-run.
  const match = result.stdout.match(/([a-z0-9]{20,})/);
  return match?.[1] ?? '';
}

/** Link the local working dir to an existing Supabase project. */
export async function link(projectRef: string, cwd: string, dryRun: boolean): Promise<void> {
  await run('supabase', ['link', '--project-ref', projectRef], { cwd, dryRun });
}

/** Tail Edge Function logs. Inherits stdio; no-op under dry-run. */
export async function functionLogs(name: string | null, dryRun: boolean): Promise<void> {
  const args = ['functions', 'log'];
  if (name !== null) args.push(name);
  await run('supabase', args, { stdio: 'inherit', dryRun });
}

/**
 * Run `prisma migrate deploy` from the web app directory using a Supabase
 * connection string. We shell out to pnpm so the workspace `prisma` resolves.
 *
 * @param webAppCwd Path to apps/web.
 * @param databaseUrl Supabase pooled URL (postgres://...).
 * @param dryRun Whether to dry-run.
 */
export async function prismaDeploy(
  webAppCwd: string,
  databaseUrl: string,
  dryRun: boolean,
): Promise<void> {
  await run('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: webAppCwd,
    env: { DATABASE_URL: databaseUrl },
    dryRun,
  });
}

/**
 * `prisma migrate diff --exit-code`: returns true if the schema is up to
 * date, false if there are pending migrations.
 */
export async function prismaDiff(
  webAppCwd: string,
  databaseUrl: string,
  dryRun: boolean,
): Promise<boolean> {
  return runOk(
    'pnpm',
    [
      'exec',
      'prisma',
      'migrate',
      'diff',
      '--from-url',
      databaseUrl,
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--exit-code',
    ],
    { cwd: webAppCwd, dryRun },
  );
}
