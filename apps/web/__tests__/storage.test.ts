/**
 * Tests for the storage abstraction. Round-trips a buffer through the local
 * disk implementation and verifies the cache + delete path.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  LocalDiskStorage,
  __resetStorageForTests,
  getStorage,
} from '../src/lib/storage';

describe('LocalDiskStorage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tinybooth-storage-'));
  });

  it('round-trips a buffer to disk', async () => {
    const storage = new LocalDiskStorage(dir, '/uploads');
    const buf = Buffer.from('hello world');
    const result = await storage.uploadBuffer('events/foo/a.webp', buf, 'image/webp');
    expect(result.url).toBe('/uploads/events/foo/a.webp');
    expect(result.key).toBe('events/foo/a.webp');
    const onDisk = await readFile(join(dir, 'events/foo/a.webp'));
    expect(onDisk.equals(buf)).toBe(true);
  });

  it('deleteObject removes the file and is idempotent on missing keys', async () => {
    const storage = new LocalDiskStorage(dir, '/uploads');
    const key = 'events/x/y.webp';
    await storage.uploadBuffer(key, Buffer.from('a'), 'image/webp');
    await storage.deleteObject(key);
    await expect(stat(join(dir, key))).rejects.toThrow();
    // Idempotent: deleting again does not throw.
    await storage.deleteObject(key);
  });

  it('cleans up via the temp dir', async () => {
    await rm(dir, { recursive: true, force: true });
  });
});

describe('getStorage()', () => {
  it('falls back to LocalDiskStorage when R2 envs are missing', () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_PUBLIC_BASE;
    __resetStorageForTests();
    const storage = getStorage();
    expect(storage).toBeInstanceOf(LocalDiskStorage);
  });
});
