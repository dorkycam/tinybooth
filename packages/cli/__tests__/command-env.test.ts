/**
 * Tests for `tinybooth env <get|set|list|sync>`. We mock execa so no real
 * vercel CLI is called; sync uses a temp .env.production.example file.
 */
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __test__, envCommand, setPromptsImpl } from '../src/commands/env';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('env command', () => {
  let calls: Array<{ file: string; args: readonly string[] }>;

  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    setExecaImpl(
      vi.fn(async (file, args) => {
        calls.push({ file, args });
        return { stdout: 'NAME\nFOO production\nBAR production\n', stderr: '', exitCode: 0 };
      }),
    );
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('returns 1 from get without a key', async () => {
    const code = await envCommand({
      action: 'get',
      target: 'production',
      repoRoot: '/repo',
    });
    expect(code).toBe(1);
  });

  it('returns 1 from set without a key/value', async () => {
    const code = await envCommand({
      action: 'set',
      target: 'production',
      repoRoot: '/repo',
    });
    expect(code).toBe(1);
  });

  it('runs vercel env add with the value piped on set', async () => {
    const code = await envCommand({
      action: 'set',
      target: 'production',
      key: 'STRIPE_SECRET_KEY',
      value: 'sk_live_x',
      repoRoot: '/repo',
    });
    expect(code).toBe(0);
    expect(calls[0]?.args).toEqual(['env', 'add', 'STRIPE_SECRET_KEY', 'production']);
  });

  it('list calls vercel env ls and exits 0', async () => {
    const code = await envCommand({
      action: 'list',
      target: 'production',
      repoRoot: '/repo',
    });
    expect(code).toBe(0);
    expect(calls[0]?.args).toEqual(['env', 'ls', 'production']);
  });

  it('sync detects missing keys, prompts for values, and uploads them', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-envsync-'));
    const examplePath = join(tmp, '.env.production.example');
    await writeFile(examplePath, 'FOO=\nBAR=\nNEW_THING=\n', 'utf8');
    // The list output above contains FOO + BAR; NEW_THING should be the only
    // missing key the sync prompts for.
    setPromptsImpl(
      vi.fn(async () => ({ value: 'piped-value' })) as unknown as Parameters<
        typeof setPromptsImpl
      >[0],
    );
    const code = await envCommand({
      action: 'sync',
      target: 'production',
      repoRoot: '/repo',
      examplePath,
    });
    expect(code).toBe(0);
    // First call was the list, second is the env add for NEW_THING.
    expect(calls[1]?.args).toEqual(['env', 'add', 'NEW_THING', 'production']);
  });

  it('sync exits 0 when every example key is already on Vercel', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-envsync-'));
    const examplePath = join(tmp, '.env.production.example');
    await writeFile(examplePath, 'FOO=\nBAR=\n', 'utf8');
    const code = await envCommand({
      action: 'sync',
      target: 'production',
      repoRoot: '/repo',
      examplePath,
    });
    expect(code).toBe(0);
    // No env add calls beyond the list.
    expect(calls).toHaveLength(1);
  });

  it('sync dry-run logs but does not call execa for the writes', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-envsync-'));
    const examplePath = join(tmp, '.env.production.example');
    await writeFile(examplePath, 'NEW_K=\n', 'utf8');
    const code = await envCommand({
      action: 'sync',
      target: 'production',
      repoRoot: '/repo',
      examplePath,
      dryRun: true,
    });
    expect(code).toBe(0);
    // The list call was dry-run too, so calls is empty.
    expect(calls).toEqual([]);
  });

  it('parseVercelList ignores the header row', () => {
    const parsed = __test__.parseVercelList('NAME    target\nFOO    production\nBAR    preview\n');
    expect(parsed.keys).toEqual(['FOO', 'BAR']);
  });
});
