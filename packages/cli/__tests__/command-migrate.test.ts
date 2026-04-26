/**
 * Dry-run + --check coverage for the migrate command.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { migrate } from '../src/commands/migrate';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('migrate', () => {
  let calls: Array<{ file: string; args: readonly string[] }>;

  beforeEach(() => {
    calls = [];
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
    process.env.DATABASE_URL = 'postgres://x:y@localhost:5432/db';
  });

  afterEach(() => {
    setExecaImpl(null);
    delete process.env.DATABASE_URL;
  });

  it('runs prisma migrate deploy under apps/web', async () => {
    setExecaImpl(
      vi.fn(async (file, args) => {
        calls.push({ file, args });
        return { stdout: '', stderr: '', exitCode: 0 };
      }),
    );
    const code = await migrate({ repoRoot: '/repo' });
    expect(code).toBe(0);
    expect(calls[0]?.file).toBe('pnpm');
    expect(calls[0]?.args).toEqual(['exec', 'prisma', 'migrate', 'deploy']);
  });

  it('returns 0 and reports up-to-date when --check sees no diff', async () => {
    setExecaImpl(vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 }));
    const code = await migrate({ repoRoot: '/repo', check: true });
    expect(code).toBe(0);
  });

  it('returns 1 when --check sees pending diff', async () => {
    setExecaImpl(vi.fn().mockRejectedValue({ exitCode: 2, stdout: '', stderr: '' }));
    const code = await migrate({ repoRoot: '/repo', check: true });
    expect(code).toBe(1);
  });

  it('errors when DATABASE_URL is not set and not in dry-run', async () => {
    delete process.env.DATABASE_URL;
    setExecaImpl(vi.fn());
    const code = await migrate({ repoRoot: '/repo' });
    expect(code).toBe(1);
  });

  it('honors --dry-run without spawning anything', async () => {
    const fake = vi.fn();
    setExecaImpl(fake);
    const code = await migrate({ repoRoot: '/repo', dryRun: true });
    expect(code).toBe(0);
    expect(fake).not.toHaveBeenCalled();
  });
});
