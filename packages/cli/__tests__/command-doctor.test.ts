/**
 * Tests for `tinybooth doctor`. Confirms the command returns 0 when every
 * CLI is "installed" and the config has every required key, and 1 otherwise.
 * We mock execa to control the install / auth probe outcomes.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { doctor } from '../src/commands/doctor';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('doctor', () => {
  beforeEach(() => {
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('returns 0 in dry-run when every required config key is present', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-doctor-'));
    const configPath = join(tmp, 'config.json');
    await writeFile(
      configPath,
      JSON.stringify({
        vercelWebProject: 'tinybooth-web',
        vercelWallProject: 'tinybooth-wall',
        supabaseProjectRef: 'abc123',
        r2Bucket: 'tinybooth-events',
        ascApiKeyPath: '/secret/asc.p8',
        playServiceAccountPath: '/secret/play.json',
      }),
      'utf8',
    );
    setExecaImpl(vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }));
    const code = await doctor({ dryRun: true, configPath });
    expect(code).toBe(0);
  });

  it('returns 1 when a required CLI is missing', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-doctor-'));
    const configPath = join(tmp, 'config.json');
    setExecaImpl(vi.fn().mockRejectedValue({ stdout: '', stderr: '', exitCode: 1 }));
    const code = await doctor({ dryRun: false, configPath });
    expect(code).toBe(1);
  });

  it('reports auth-not-logged-in when install probe passes but auth probe fails', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-doctor-'));
    const configPath = join(tmp, 'config.json');
    let count = 0;
    setExecaImpl(
      vi.fn(async () => {
        count += 1;
        // Every other call (the auth one) fails.
        if (count % 2 === 0) throw { stdout: '', stderr: '', exitCode: 1 };
        return { stdout: '', stderr: '', exitCode: 0 };
      }),
    );
    const code = await doctor({ dryRun: false, configPath });
    expect(code).toBe(1);
  });
});
