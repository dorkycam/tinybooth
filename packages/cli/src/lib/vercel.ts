/**
 * `vercel` CLI wrapper. Shells out via the shared `run` helper so dry-run
 * propagates correctly. Avoids `@vercel/sdk` because matching the user's
 * shell-typed commands is more durable than tracking SDK versions.
 */
import { run, runOk } from './shell.js';

/** Options shared by every vercel command. */
interface VercelOptions {
  /** When true, log the command instead of running it. */
  dryRun?: boolean;
  /** Working directory of the linked Vercel project. */
  cwd: string;
}

/** Whether `vercel whoami` returns a logged-in account. */
export async function isLoggedIn(): Promise<boolean> {
  return runOk('vercel', ['whoami']);
}

/** Spawn `vercel login` interactively. Always inherits stdio. */
export async function login(dryRun: boolean): Promise<void> {
  await run('vercel', ['login'], { stdio: 'inherit', dryRun });
}

/** Run `vercel link` to create / attach a project in the given cwd. */
export async function link(projectName: string, options: VercelOptions): Promise<void> {
  await run('vercel', ['link', '--yes', '--project', projectName], {
    cwd: options.cwd,
    dryRun: options.dryRun,
  });
}

/**
 * Deploy a project. Returns the URL printed by Vercel on success (empty
 * string under dry-run).
 *
 * @param production True for `--prod`. False for a preview deploy.
 */
export async function deploy(production: boolean, options: VercelOptions): Promise<string> {
  const args = ['deploy'];
  if (production) args.push('--prod');
  const result = await run('vercel', args, { cwd: options.cwd, dryRun: options.dryRun });
  return result.stdout.trim();
}

/**
 * Tail logs from a deployment. Inherits stdio so the user can watch the live
 * stream. No-ops under dry-run.
 */
export async function logs(deploymentUrl: string, follow: boolean, dryRun: boolean): Promise<void> {
  const args = ['logs', deploymentUrl];
  if (follow) args.push('--follow');
  await run('vercel', args, { stdio: 'inherit', dryRun });
}

/** Add an env var to the linked project. Value is piped via stdin. */
export async function envAdd(
  key: string,
  value: string,
  target: 'production' | 'preview' | 'development',
  options: VercelOptions,
): Promise<void> {
  await run('vercel', ['env', 'add', key, target], {
    cwd: options.cwd,
    input: value,
    dryRun: options.dryRun,
  });
}

/** Remove an env var from the linked project. */
export async function envRemove(
  key: string,
  target: 'production' | 'preview' | 'development',
  options: VercelOptions,
): Promise<void> {
  await run('vercel', ['env', 'rm', key, target, '--yes'], {
    cwd: options.cwd,
    dryRun: options.dryRun,
  });
}

/**
 * List env vars for the linked project. Returns the raw textual output from
 * vercel; callers parse what they need.
 */
export async function envList(
  target: 'production' | 'preview' | 'development',
  options: VercelOptions,
): Promise<string> {
  const result = await run('vercel', ['env', 'ls', target], {
    cwd: options.cwd,
    dryRun: options.dryRun,
  });
  return result.stdout;
}
