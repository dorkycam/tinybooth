/**
 * `tinybooth release <ios|android|both> [--track=internal|production]` --
 * mobile release flow. We delegate to the existing
 * `apps/mobile/scripts/build-and-submit.sh` so the audit trail stays in one
 * place; CI still uses that script directly.
 *
 * After the build/submit pair, we run the Fastlane `metadata_push` lane so
 * App Store Connect copy stays in sync with the repo.
 */
import { resolve } from 'node:path';
import * as fastlane from '../lib/fastlane.js';
import { error, info, success } from '../lib/ui.js';

/** Platforms understood by the release command. */
export type ReleasePlatform = 'ios' | 'android' | 'both';

/** Tracks understood by the release command. */
export type ReleaseTrack = 'internal' | 'production';

/** Flags accepted by `tinybooth release`. */
export interface ReleaseFlags {
  /** Platform to ship. */
  platform: ReleasePlatform;
  /** Distribution track. `internal` maps to the EAS `preview` profile. */
  track: ReleaseTrack;
  /** Repo root used to resolve apps/mobile. */
  repoRoot: string;
  /** When true, log without executing. */
  dryRun?: boolean;
  /** When true, skip the fastlane metadata push afterwards. */
  skipMetadata?: boolean;
}

/** Map our `internal | production` track to the EAS profile name. */
function profileFor(track: ReleaseTrack): 'preview' | 'production' {
  return track === 'internal' ? 'preview' : 'production';
}

/** Run the release command. */
export async function release(flags: ReleaseFlags): Promise<number> {
  if (flags.platform !== 'ios' && flags.platform !== 'android' && flags.platform !== 'both') {
    error(`Unknown platform: ${String(flags.platform)}`);
    return 1;
  }

  const mobileCwd = resolve(flags.repoRoot, 'apps/mobile');
  const profile = profileFor(flags.track);
  info(`Releasing ${flags.platform} on ${flags.track} (EAS profile: ${profile}).`);

  // We always go through the legacy script so its safety prompts run. The
  // script handles `eas build --platform all`; on per-platform runs we let
  // it ship both, then rely on EAS to no-op the platform we don't want.
  await fastlane.runLegacyBuildAndSubmit(profile, { cwd: mobileCwd, dryRun: flags.dryRun });

  if (flags.skipMetadata !== true) {
    info('Pushing App Store Connect metadata via Fastlane.');
    await fastlane.runLane('metadata_push', { cwd: mobileCwd, dryRun: flags.dryRun });
  }

  success('Release flow complete. Watch EAS for build IDs and the stores for review status.');
  return 0;
}
