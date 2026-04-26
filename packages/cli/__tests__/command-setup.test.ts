/**
 * Dry-run coverage for the big setup flow. We mock prompts so the test does
 * not block on stdin and inject a fake execa so no real provider CLI is hit.
 */
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setup, setPromptsImpl, resetPromptsImpl } from '../src/commands/setup';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('setup --dry-run', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    setLogger({
      log: vi.fn((msg: string) => logged.push(msg)),
      info: vi.fn((msg: string) => logged.push(msg)),
      warn: vi.fn((msg: string) => logged.push(msg)),
      error: vi.fn((msg: string) => logged.push(msg)),
    });
    // Under dry-run, run() never calls execa, but runOk() also short-circuits
    // to true, so the "logged in?" probes report success and we never hit a
    // login prompt. Still, install a sentinel to catch accidental spawns.
    setExecaImpl(vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }));

    // Prompts are stubbed to return predictable values for every question.
    setPromptsImpl(
      vi.fn(async (config: unknown) => {
        const conf = config as { name?: string; type?: string; initial?: string };
        if (conf.name === 'value' && conf.type === 'select') return { value: 'create' };
        if (conf.name === 'go') return { go: true };
        if (conf.name === 'value') {
          // Use the initial if provided, else a deterministic stub value.
          return { value: conf.initial ?? 'stub' };
        }
        return { value: 'stub' };
      }) as unknown as Parameters<typeof setPromptsImpl>[0],
    );
  });

  afterEach(() => {
    setExecaImpl(null);
    resetPromptsImpl();
  });

  it('walks through every step under dry-run and exits 0', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-setup-'));
    const configPath = join(tmp, 'config.json');
    process.env.STRIPE_SECRET_KEY = '';

    const code = await setup({ dryRun: true, repoRoot: tmp, configPath });
    expect(code).toBe(0);

    const all = logged.join('\n');
    expect(all).toContain('Verify required CLIs');
    expect(all).toContain('Vercel login');
    expect(all).toContain('Supabase login');
    expect(all).toContain('App Store Connect API key');
    expect(all).toContain('Materialize Stripe products');
    expect(all).toContain('DRY RUN');
  });

  it('prints the human follow-up checklist regardless of dry-run', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'tb-cli-setup-'));
    const configPath = join(tmp, 'config.json');
    await setup({ dryRun: true, repoRoot: tmp, configPath });
    const all = logged.join('\n');
    expect(all).toContain('Apple Small Business Program');
    expect(all).toContain('Google Play Console');
    expect(all).toContain('RevenueCat');
    expect(all).toContain('Stripe KYC');
  });
});
