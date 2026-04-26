/**
 * Unit tests for the execa wrapper. Covers dry-run, success, error mapping,
 * and the `runOk` boolean helper. We never spawn a real process; the execa
 * impl is injected via `setExecaImpl`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShellError, formatCommand, run, runOk, setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('shell.run', () => {
  beforeEach(() => {
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('returns dryRun=true and never spawns under --dry-run', async () => {
    const fake = vi.fn();
    setExecaImpl(fake);
    const result = await run('vercel', ['deploy'], { dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(fake).not.toHaveBeenCalled();
  });

  it('passes args, cwd, env, stdio through to execa', async () => {
    const fake = vi.fn().mockResolvedValue({ stdout: 'hi', stderr: '', exitCode: 0 });
    setExecaImpl(fake);
    const result = await run('echo', ['hi'], { cwd: '/tmp', env: { FOO: 'bar' } });
    expect(fake).toHaveBeenCalledOnce();
    const callArgs = fake.mock.calls[0];
    expect(callArgs[0]).toBe('echo');
    expect(callArgs[1]).toEqual(['hi']);
    const opts = callArgs[2] as { cwd?: string; env?: Record<string, string> };
    expect(opts.cwd).toBe('/tmp');
    expect(opts.env?.FOO).toBe('bar');
    expect(result.stdout).toBe('hi');
  });

  it('wraps a non-zero exit in ShellError', async () => {
    const fake = vi.fn().mockRejectedValue({
      stdout: 'partial',
      stderr: 'bad things',
      exitCode: 7,
    });
    setExecaImpl(fake);
    await expect(run('bad', ['arg'])).rejects.toBeInstanceOf(ShellError);
    try {
      await run('bad', ['arg']);
    } catch (err: unknown) {
      const e = err as ShellError;
      expect(e.exitCode).toBe(7);
      expect(e.stderr).toBe('bad things');
      expect(e.stdout).toBe('partial');
    }
  });
});

describe('shell.runOk', () => {
  beforeEach(() => {
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('returns true when the command succeeds', async () => {
    setExecaImpl(vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }));
    expect(await runOk('echo', ['ok'])).toBe(true);
  });

  it('returns false when the command throws', async () => {
    setExecaImpl(vi.fn().mockRejectedValue({ stdout: '', stderr: 'no', exitCode: 1 }));
    expect(await runOk('false', [])).toBe(false);
  });

  it('returns true under --dry-run without spawning', async () => {
    const fake = vi.fn();
    setExecaImpl(fake);
    expect(await runOk('vercel', ['whoami'], { dryRun: true })).toBe(true);
    expect(fake).not.toHaveBeenCalled();
  });
});

describe('formatCommand', () => {
  it('joins args with spaces', () => {
    expect(formatCommand('vercel', ['deploy', '--prod'])).toBe('vercel deploy --prod');
  });

  it('quotes args containing whitespace', () => {
    expect(formatCommand('git', ['commit', '-m', 'a b c'])).toBe('git commit -m "a b c"');
  });
});
