/**
 * Tests for the bulk export job. We mock storage + fetch + db so the test
 * exercises the full READY/FAILED state transitions without touching disk
 * or the network.
 */
import { describe, expect, it, vi } from 'vitest';
import { runExportJob } from '../src/server/jobs/exportEvent';
import type { Storage } from '../src/lib/storage';

class StubStorage implements Storage {
  public uploaded: Array<{ key: string; size: number }> = [];
  async uploadBuffer(
    key: string,
    buf: Buffer,
  ): Promise<{ url: string; key: string }> {
    this.uploaded.push({ key, size: buf.length });
    return { url: `http://stub/${key}`, key };
  }
  async deleteObject(): Promise<void> {
    /* unused */
  }
}

function makeFetch(payloads: Map<string, Buffer>): typeof fetch {
  return (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const buf = payloads.get(url);
    if (!buf) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(buf));
  }) as typeof fetch;
}

describe('runExportJob', () => {
  it('marks the export READY and produces a non-empty zip', async () => {
    const storage = new StubStorage();
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      event: {
        findUnique: vi.fn(async () => ({
          id: 'e1',
          name: 'Sam 30',
          slug: 'sam-30',
        })),
      },
      photo: {
        findMany: vi.fn(async () => [
          { id: 'p1', storageKey: 'events/e1/posts/x/p1.webp', url: 'http://photos/p1' },
          { id: 'p2', storageKey: 'events/e1/strips/y/p2.webp', url: 'http://photos/p2' },
        ]),
      },
      export: {
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          updates.push({ ...data });
          return data;
        }),
      },
    };
    const payloads = new Map([
      ['http://photos/p1', Buffer.from('photo-1-bytes')],
      ['http://photos/p2', Buffer.from('photo-2-bytes')],
    ]);
    const result = await runExportJob({
      db,
      storage,
      exportId: 'x1',
      eventId: 'e1',
      userEmail: null,
      fetchImpl: makeFetch(payloads),
    });
    expect(result.status).toBe('READY');
    expect(result.fileCount).toBe(2);
    expect(storage.uploaded).toHaveLength(1);
    expect(storage.uploaded[0]?.key).toBe('events/e1/exports/x1.zip');
    expect(storage.uploaded[0]?.size).toBeGreaterThan(50);
    // First update: status RUNNING. Last update: READY.
    expect(updates[0]?.status).toBe('RUNNING');
    expect(updates[updates.length - 1]?.status).toBe('READY');
  });

  it('falls back to FAILED when the event is missing', async () => {
    const storage = new StubStorage();
    const updates: Array<Record<string, unknown>> = [];
    const db = {
      event: { findUnique: vi.fn(async () => null) },
      photo: { findMany: vi.fn() },
      export: {
        update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          updates.push({ ...data });
          return data;
        }),
      },
    };
    const result = await runExportJob({
      db,
      storage,
      exportId: 'x1',
      eventId: 'missing',
      userEmail: null,
      fetchImpl: makeFetch(new Map()),
    });
    expect(result.status).toBe('FAILED');
    expect(result.errorMsg).toMatch(/event not found/);
    expect(updates[updates.length - 1]?.status).toBe('FAILED');
  });

  it('skips photos that fail to fetch but still completes', async () => {
    const storage = new StubStorage();
    const db = {
      event: {
        findUnique: vi.fn(async () => ({ id: 'e1', name: 'X', slug: 'x' })),
      },
      photo: {
        findMany: vi.fn(async () => [
          { id: 'p1', storageKey: 'events/e1/posts/x/p1.webp', url: 'http://photos/missing' },
        ]),
      },
      export: { update: vi.fn(async () => null) },
    };
    const result = await runExportJob({
      db,
      storage,
      exportId: 'x1',
      eventId: 'e1',
      userEmail: null,
      fetchImpl: makeFetch(new Map()),
    });
    expect(result.status).toBe('READY');
    expect(result.fileCount).toBe(1); // photos count, not bytes-ingested
  });
});
