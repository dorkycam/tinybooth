/**
 * `bundle exec fastlane` wrapper. Fastlane drives App Store Connect metadata
 * and screenshot pushes from `apps/mobile/fastlane/`. We invoke the lanes
 * already defined in `Fastfile` rather than redefining them here.
 */
import { run, runOk } from './shell.js';

/** Options for invoking a fastlane lane. */
interface FastlaneOptions {
  /** When true, log instead of executing. */
  dryRun?: boolean;
  /** Path to apps/mobile (the dir holding `fastlane/`). */
  cwd: string;
}

/** Whether `bundle` (Bundler) is on PATH. */
export async function bundleAvailable(): Promise<boolean> {
  return runOk('bundle', ['--version']);
}

/** Run a named lane: `bundle exec fastlane <lane>`. */
export async function runLane(lane: string, options: FastlaneOptions): Promise<void> {
  await run('bundle', ['exec', 'fastlane', lane], {
    cwd: options.cwd,
    stdio: 'inherit',
    dryRun: options.dryRun,
  });
}

/** Run the legacy build-and-submit shell script. Kept until CI stops using it. */
export async function runLegacyBuildAndSubmit(
  profile: 'preview' | 'production',
  options: FastlaneOptions,
): Promise<void> {
  await run('./scripts/build-and-submit.sh', [profile], {
    cwd: options.cwd,
    stdio: 'inherit',
    dryRun: options.dryRun,
  });
}
