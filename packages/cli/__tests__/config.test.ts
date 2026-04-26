/**
 * Tests for the persistent config helpers (~/.config/tinybooth/config.json).
 * Round-trip + patch behavior + missing-file fallback.
 */
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultConfigPath, loadConfig, patchConfig, saveConfig } from '../src/lib/config';

describe('CliConfig', () => {
  it('returns {} when the file is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tb-cli-cfg-'));
    const config = await loadConfig(join(dir, 'missing.json'));
    expect(config).toEqual({});
  });

  it('round-trips a saved config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tb-cli-cfg-'));
    const path = join(dir, 'config.json');
    await saveConfig({ vercelWebProject: 'web', r2Bucket: 'b' }, path);
    expect(await loadConfig(path)).toEqual({ vercelWebProject: 'web', r2Bucket: 'b' });
  });

  it('patchConfig merges and persists', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tb-cli-cfg-'));
    const path = join(dir, 'config.json');
    await saveConfig({ vercelWebProject: 'web' }, path);
    const merged = await patchConfig({ r2Bucket: 'b' }, path);
    expect(merged).toEqual({ vercelWebProject: 'web', r2Bucket: 'b' });
    expect(await loadConfig(path)).toEqual({ vercelWebProject: 'web', r2Bucket: 'b' });
  });

  it('defaultConfigPath ends with the canonical filename', () => {
    expect(defaultConfigPath().endsWith('config.json')).toBe(true);
    expect(defaultConfigPath()).toContain('tinybooth');
  });
});
