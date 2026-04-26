/**
 * `eas` CLI wrapper. EAS Build + Submit handles iOS and Android binaries.
 * The CLI's `release` command shells out here; for the legacy
 * `apps/mobile/scripts/build-and-submit.sh` we keep a thin caller in
 * `lib/fastlane.ts`.
 */
import { run, runOk } from './shell.js';

/** Options shared by build / submit. */
interface EasOptions {
  /** When true, log instead of executing. */
  dryRun?: boolean;
  /** Working directory of the mobile app (apps/mobile). */
  cwd: string;
}

/** Whether the EAS CLI is logged in. */
export async function isLoggedIn(): Promise<boolean> {
  return runOk('eas', ['whoami']);
}

/** Spawn `eas login` interactively. */
export async function login(dryRun: boolean): Promise<void> {
  await run('eas', ['login'], { stdio: 'inherit', dryRun });
}

/** Run `eas build --platform <p> --profile <p>`. */
export async function build(
  platform: 'ios' | 'android' | 'all',
  profile: 'preview' | 'production',
  options: EasOptions,
): Promise<void> {
  await run(
    'eas',
    ['build', '--platform', platform, '--profile', profile, '--non-interactive'],
    { cwd: options.cwd, stdio: 'inherit', dryRun: options.dryRun },
  );
}

/** Run `eas submit --platform <p> --profile <p>`. */
export async function submit(
  platform: 'ios' | 'android' | 'all',
  profile: 'preview' | 'production',
  options: EasOptions,
): Promise<void> {
  await run(
    'eas',
    ['submit', '--platform', platform, '--profile', profile, '--non-interactive'],
    { cwd: options.cwd, stdio: 'inherit', dryRun: options.dryRun },
  );
}

/** Run `eas update --branch <branch>` for OTA JS-only updates. */
export async function update(branch: string, message: string, options: EasOptions): Promise<void> {
  await run('eas', ['update', '--branch', branch, '--message', message, '--non-interactive'], {
    cwd: options.cwd,
    stdio: 'inherit',
    dryRun: options.dryRun,
  });
}
