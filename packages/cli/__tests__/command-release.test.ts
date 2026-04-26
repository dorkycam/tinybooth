/**
 * Tests for `tinybooth release`. Confirms the legacy build-and-submit shell
 * script is invoked from apps/mobile with the right profile, and that the
 * follow-up Fastlane lane runs unless --skip-metadata.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { release } from '../src/commands/release';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('release', () => {
  let calls: Array<{ file: string; args: readonly string[]; cwd?: string }>;
  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    setExecaImpl(
      vi.fn(async (file, args, opts) => {
        const o = opts as { cwd?: string };
        calls.push({ file, args, cwd: o.cwd });
        return { stdout: '', stderr: '', exitCode: 0 };
      }),
    );
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('maps internal track to the EAS preview profile', async () => {
    const code = await release({
      platform: 'both',
      track: 'internal',
      repoRoot: '/repo',
    });
    expect(code).toBe(0);
    expect(calls[0]?.file).toBe('./scripts/build-and-submit.sh');
    expect(calls[0]?.args).toEqual(['preview']);
    expect(calls[0]?.cwd).toBe('/repo/apps/mobile');
  });

  it('maps production track to the EAS production profile', async () => {
    await release({ platform: 'ios', track: 'production', repoRoot: '/repo' });
    expect(calls[0]?.args).toEqual(['production']);
  });

  it('runs the metadata_push lane unless --skip-metadata', async () => {
    await release({ platform: 'both', track: 'internal', repoRoot: '/repo' });
    expect(calls[1]?.file).toBe('bundle');
    expect(calls[1]?.args).toEqual(['exec', 'fastlane', 'metadata_push']);
  });

  it('skips the metadata lane with --skip-metadata', async () => {
    await release({
      platform: 'both',
      track: 'internal',
      repoRoot: '/repo',
      skipMetadata: true,
    });
    expect(calls).toHaveLength(1);
  });

  it('rejects an unknown platform', async () => {
    const code = await release({
      platform: 'windows-phone' as unknown as 'ios',
      track: 'internal',
      repoRoot: '/repo',
    });
    expect(code).toBe(1);
  });
});
