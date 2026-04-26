/**
 * Tests for the .env file reader / writer + the missingKeys helper.
 * Round-tripping is the core property: parse(stringify(x)) === x.
 */
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  missingKeys,
  parseEnv,
  readEnvFile,
  stringifyEnv,
  vercelEnvAdd,
  writeEnvFile,
} from '../src/lib/env';
import { setExecaImpl } from '../src/lib/shell';
import { setLogger } from '../src/lib/ui';

describe('parseEnv', () => {
  it('returns empty for empty input', () => {
    const result = parseEnv('');
    expect(result.keys).toEqual([]);
    expect(result.values).toEqual({});
  });

  it('handles comments, blank lines, and quoted values', () => {
    const body = `# header\nFOO=1\nBAR="b a r"\n\n#\nBAZ='quux'\n`;
    const result = parseEnv(body);
    expect(result.keys).toEqual(['FOO', 'BAR', 'BAZ']);
    expect(result.values).toEqual({ FOO: '1', BAR: 'b a r', BAZ: 'quux' });
  });

  it('skips lines without an = sign and lines with empty key', () => {
    const result = parseEnv('NOT_A_KV\n=value\nOK=1\n');
    expect(result.keys).toEqual(['OK']);
    expect(result.values).toEqual({ OK: '1' });
  });

  it('preserves last value when a key is repeated and does not duplicate the key', () => {
    const result = parseEnv('K=1\nK=2\n');
    expect(result.keys).toEqual(['K']);
    expect(result.values.K).toBe('2');
  });
});

describe('stringifyEnv', () => {
  it('round-trips a simple file', () => {
    const env = { keys: ['A', 'B'], values: { A: '1', B: '2' } };
    expect(stringifyEnv(env)).toBe('A=1\nB=2\n');
  });

  it('quotes values that contain whitespace, hash, or quotes', () => {
    const env = { keys: ['SPACE', 'HASH'], values: { SPACE: 'a b', HASH: 'x#y' } };
    const out = stringifyEnv(env);
    expect(out).toContain('SPACE="a b"');
    expect(out).toContain('HASH="x#y"');
  });
});

describe('readEnvFile', () => {
  it('returns empty when the file does not exist', async () => {
    const result = await readEnvFile('/no/such/path/.env.example');
    expect(result.keys).toEqual([]);
  });

  it('reads back what we just wrote', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tb-cli-env-'));
    const path = join(dir, '.env');
    await writeFile(path, 'A=1\nB="two"\n', 'utf8');
    const env = await readEnvFile(path);
    expect(env.values).toEqual({ A: '1', B: 'two' });
  });
});

describe('writeEnvFile', () => {
  it('serializes to disk', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tb-cli-env-'));
    const path = join(dir, '.env');
    await writeEnvFile(path, { keys: ['A'], values: { A: '1' } });
    const onDisk = await readFile(path, 'utf8');
    expect(onDisk).toBe('A=1\n');
  });
});

describe('missingKeys', () => {
  it('returns keys present in template but missing or empty in current', () => {
    const template = { keys: ['A', 'B', 'C'], values: { A: 'x', B: 'y', C: 'z' } };
    const current = { keys: ['A', 'B'], values: { A: '1', B: '' } };
    expect(missingKeys(template, current)).toEqual(['B', 'C']);
  });

  it('returns [] when nothing is missing', () => {
    const template = { keys: ['A'], values: { A: 'x' } };
    const current = { keys: ['A'], values: { A: 'y' } };
    expect(missingKeys(template, current)).toEqual([]);
  });
});

describe('vercelEnvAdd', () => {
  beforeEach(() => {
    setLogger({ log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() });
  });
  afterEach(() => {
    setExecaImpl(null);
  });

  it('shells out to vercel env add with the value piped via stdin', async () => {
    const fake = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    setExecaImpl(fake);
    await vercelEnvAdd('STRIPE_SECRET_KEY', 'sk_live_x', 'production', '/repo/apps/web', false);
    expect(fake).toHaveBeenCalledOnce();
    const call = fake.mock.calls[0];
    expect(call[0]).toBe('vercel');
    expect(call[1]).toEqual(['env', 'add', 'STRIPE_SECRET_KEY', 'production']);
    const opts = call[2] as { input?: string; cwd?: string };
    expect(opts.input).toBe('sk_live_x');
    expect(opts.cwd).toBe('/repo/apps/web');
  });

  it('honors dry-run and never spawns', async () => {
    const fake = vi.fn();
    setExecaImpl(fake);
    await vercelEnvAdd('K', 'v', 'production', '/repo', true);
    expect(fake).not.toHaveBeenCalled();
  });
});
