/**
 * Dry-run coverage for the deploy command. Asserts the right shell commands
 * would be issued (vercel deploy + the turbo quality gate), in the right
 * order, against the right working directories.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deploy } from '../src/commands/deploy';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('deploy --dry-run', () => {
  let calls: Array<{ file: string; args: readonly string[]; cwd?: string }>;

  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    // Even under dry-run we should not see execa calls; we still set a sentinel
    // so an accidental real call would be caught.
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

  it('logs the would-run commands and never spawns', async () => {
    const code = await deploy({ dryRun: true, repoRoot: '/repo' });
    expect(code).toBe(0);
    expect(calls).toEqual([]);
  });

  it('runs the quality gate before either vercel deploy when not skipped', async () => {
    setExecaImpl(
      vi.fn(async (file, args, opts) => {
        const o = opts as { cwd?: string };
        calls.push({ file, args, cwd: o.cwd });
        return { stdout: 'https://example.com', stderr: '', exitCode: 0 };
      }),
    );
    const code = await deploy({ dryRun: false, repoRoot: '/repo' });
    expect(code).toBe(0);
    expect(calls[0]?.file).toBe('pnpm');
    expect(calls[0]?.args).toContain('turbo');
    // Then web deploy.
    expect(calls[1]?.file).toBe('vercel');
    expect(calls[1]?.args).toContain('deploy');
    expect(calls[1]?.args).toContain('--prod');
    expect(calls[1]?.cwd).toBe('/repo/apps/web');
    // Then wall deploy.
    expect(calls[2]?.cwd).toBe('/repo/apps/wall');
  });

  it('omits --prod when --staging is passed', async () => {
    const code = await deploy({
      dryRun: false,
      staging: true,
      skipQuality: true,
      repoRoot: '/repo',
    });
    expect(code).toBe(0);
    expect(calls[0]?.args).not.toContain('--prod');
  });

  it('skips the quality gate when --skip-quality is set', async () => {
    const code = await deploy({
      dryRun: false,
      skipQuality: true,
      repoRoot: '/repo',
    });
    expect(code).toBe(0);
    // No turbo call, only the two vercel deploys.
    expect(calls.find((c) => c.file === 'pnpm')).toBeUndefined();
    expect(calls).toHaveLength(2);
  });
});
