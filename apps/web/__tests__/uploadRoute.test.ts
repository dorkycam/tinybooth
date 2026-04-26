/**
 * Tests for the /api/upload REST handler. Builds a minimal multipart Request
 * via undici's `FormData` (built into modern Node) and invokes the route.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { POST } from '../app/api/upload/route';
import { __resetStorageForTests } from '../src/lib/storage';
import { __resetLimiterForTests } from '../src/lib/rateLimit';

beforeEach(() => {
  __resetStorageForTests();
  __resetLimiterForTests();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.R2_ACCOUNT_ID;
  delete process.env.R2_ACCESS_KEY_ID;
  delete process.env.R2_SECRET_ACCESS_KEY;
  delete process.env.R2_BUCKET;
  delete process.env.R2_PUBLIC_BASE;
});

async function makePngBuffer(): Promise<Buffer> {
  return sharp({
    create: { width: 32, height: 32, channels: 3, background: { r: 200, g: 80, b: 80 } },
  })
    .png()
    .toBuffer();
}

describe('POST /api/upload', () => {
  it('returns 400 when eventSlug missing', async () => {
    const form = new FormData();
    form.append('photos', new Blob([new Uint8Array([120])]), 'a.png');
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('returns 400 when no files attached', async () => {
    const form = new FormData();
    form.append('eventSlug', 'demo');
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('processes a single file end-to-end into LocalDiskStorage', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-uproute-'));
    process.env.LOCAL_UPLOAD_BASE_URL = '/uploads';
    // Force the LocalDiskStorage to write to our temp dir by faking cwd via
    // the constructor path. Easiest path: monkey-patch process.cwd just for
    // this test.
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    __resetStorageForTests();
    try {
      const png = await makePngBuffer();
      const form = new FormData();
      form.append('eventSlug', 'demo');
      form.append(
        'photos',
        new Blob([new Uint8Array(png)], { type: 'image/png' }),
        'a.png',
      );
      const req = new Request('http://localhost/api/upload', { method: 'POST', body: form });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await POST(req as any);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { photos: Array<{ url: string; storageKey: string }> };
      expect(body.photos).toHaveLength(1);
      expect(body.photos[0]!.url).toContain('/uploads/events/demo/');
      // Confirm the file exists on disk.
      const onDisk = await readFile(join(dir, '.uploads', body.photos[0]!.storageKey));
      expect(onDisk.length).toBeGreaterThan(0);
    } finally {
      process.cwd = origCwd;
    }
  });

  it('rejects more than 10 files', async () => {
    const form = new FormData();
    form.append('eventSlug', 'demo');
    for (let i = 0; i < 11; i += 1) {
      form.append(
        'photos',
        new Blob([new Uint8Array([120])], { type: 'image/png' }),
        `${i}.png`,
      );
    }
    const req = new Request('http://localhost/api/upload', { method: 'POST', body: form });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

});
