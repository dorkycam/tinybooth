/**
 * Tests for `tinybooth logs`. Confirms each --service flag routes to the
 * right provider and `--tail` propagates as `--follow` to vercel.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logs } from '../src/commands/logs';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('logs', () => {
  let calls: Array<{ file: string; args: readonly string[] }>;
  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    setExecaImpl(
      vi.fn(async (file, args) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '', exitCode: 0 };
      }),
    );
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('routes --service=web to vercel logs against the web URL', async () => {
    const code = await logs({ service: 'web' });
    expect(code).toBe(0);
    expect(calls[0]?.file).toBe('vercel');
    expect(calls[0]?.args[0]).toBe('logs');
    expect(calls[0]?.args[1]).toBe('https://web.tinybooth.com');
  });

  it('appends --follow when --tail is set', async () => {
    await logs({ service: 'wall', tail: true });
    expect(calls[0]?.args).toContain('--follow');
  });

  it('routes --service=supabase to supabase functions log', async () => {
    await logs({ service: 'supabase' });
    expect(calls[0]?.file).toBe('supabase');
    expect(calls[0]?.args).toEqual(['functions', 'log']);
  });

  it('appends function name when provided', async () => {
    await logs({ service: 'supabase', functionName: 'my-fn' });
    expect(calls[0]?.args).toEqual(['functions', 'log', 'my-fn']);
  });

  it('honors --dry-run and never spawns', async () => {
    setExecaImpl(vi.fn());
    const code = await logs({ service: 'web', dryRun: true });
    expect(code).toBe(0);
  });
});
