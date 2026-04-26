/**
 * Bulk export job for an event.
 *
 * Streams every photo for an event out of object storage, packages them into
 * a single zip via `archiver`, uploads the zip back to storage at
 * `events/{eventId}/exports/{exportId}.zip`, signs a 24h URL (or a local URL
 * when running against LocalDiskStorage), and marks the Export row READY.
 *
 * The job is invoked from the dashboard router as a fire-and-forget
 * background task. All state lives on the Export row so the dashboard's
 * polling endpoint can render progress without holding a connection open.
 */
import { buildZip } from '../../lib/zip';
import type { Storage } from '../../lib/storage';
import { sendEmail } from '../../lib/email';

/** Minimum prisma surface needed by the job. */
interface PhotoRow {
  id: string;
  storageKey: string;
  url: string;
}
interface EventRow {
  id: string;
  name: string;
  slug: string;
}
/**
 * Loose prisma surface. Both the production PrismaClient and the in-memory
 * test mock satisfy this without coercion. We narrow per-method below.
 */
export interface ExportJobDb {
  event: {
    findUnique(args: { where: { id: string } }): Promise<EventRow | null>;
  };
  photo: {
    findMany(args: { where: unknown; select: unknown }): Promise<PhotoRow[]>;
  };
  export: {
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
  };
}

/** Minimum http-fetch interface (so tests can stub network calls). */
export type FetchLike = typeof fetch;

export interface ExportJobOptions {
  db: ExportJobDb;
  storage: Storage;
  exportId: string;
  eventId: string;
  /** Recipient for the "your export is ready" email. Skipped when null. */
  userEmail: string | null;
  /** Test-only fetch override; defaults to global fetch. */
  fetchImpl?: FetchLike;
  /** Test-only base URL; the dashboard's signed link points here. */
  webBaseUrl?: string;
}

/** Result the caller can use to log a summary. */
export interface ExportJobResult {
  status: 'READY' | 'FAILED';
  storageKey: string | null;
  signedUrl: string | null;
  expiresAt: Date | null;
  fileCount: number;
  errorMsg: string | null;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Run a bulk-export job. Updates the Export row through PENDING -> RUNNING
 * -> READY/FAILED. Returns the final summary. Errors are caught and recorded
 * on the row; the function never throws.
 *
 * @param opts Job inputs.
 */
export async function runExportJob(opts: ExportJobOptions): Promise<ExportJobResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const exportRow: Record<string, unknown> = {};
  try {
    await opts.db.export.update({
      where: { id: opts.exportId },
      data: { status: 'RUNNING' },
    });
    const event = await opts.db.event.findUnique({ where: { id: opts.eventId } });
    if (!event) throw new Error('event not found');
    const photos = await opts.db.photo.findMany({
      where: {
        OR: [
          { post: { eventId: opts.eventId } },
          { strip: { eventId: opts.eventId } },
        ],
      },
      select: { id: true, storageKey: true, url: true },
    });

    const entries: Array<{ name: string; data: Buffer }> = [];
    for (const p of photos) {
      const buf = await fetchPhoto(p.url, fetchImpl);
      if (!buf) continue;
      entries.push({ name: filenameFor(p, event.slug), data: buf });
    }
    const zipBuf = buildZip(entries);

    const storageKey = `events/${opts.eventId}/exports/${opts.exportId}.zip`;
    const stored = await opts.storage.uploadBuffer(storageKey, zipBuf, 'application/zip');
    const signedUrl = stored.url;
    const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

    Object.assign(exportRow, {
      status: 'READY',
      storageKey,
      signedUrl,
      expiresAt,
      completedAt: new Date(),
    });
    await opts.db.export.update({ where: { id: opts.exportId }, data: exportRow });

    if (opts.userEmail) {
      await sendEmail({
        to: opts.userEmail,
        subject: `Your TinyBooth export for "${event.name}" is ready`,
        html: renderEmailHtml(event.name, signedUrl, expiresAt),
      });
    }
    return {
      status: 'READY',
      storageKey,
      signedUrl,
      expiresAt,
      fileCount: photos.length,
      errorMsg: null,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await opts.db.export.update({
      where: { id: opts.exportId },
      data: { status: 'FAILED', errorMsg, completedAt: new Date() },
    });
    return {
      status: 'FAILED',
      storageKey: null,
      signedUrl: null,
      expiresAt: null,
      fileCount: 0,
      errorMsg,
    };
  }
}

async function fetchPhoto(url: string, fetchImpl: FetchLike): Promise<Buffer | null> {
  try {
    const res = await fetchImpl(url);
    if (!res.ok) return null;
    const arr = await res.arrayBuffer();
    return Buffer.from(arr);
  } catch {
    return null;
  }
}

function filenameFor(
  photo: { id: string; storageKey: string },
  eventSlug: string,
): string {
  // Preserve the trailing path segment from the storage key so duplicate ids
  // do not collide and the source layout stays visible inside the zip.
  const tail = photo.storageKey.split('/').slice(-2).join('/');
  return `${eventSlug}/${tail}`;
}

function renderEmailHtml(eventName: string, url: string, expiresAt: Date): string {
  const safeName = escapeHtml(eventName);
  const safeUrl = escapeHtml(url);
  const expires = escapeHtml(expiresAt.toISOString());
  return `<p>Your bulk export for <strong>${safeName}</strong> is ready.</p>
<p><a href="${safeUrl}">Download the zip</a> (link expires ${expires}).</p>
<p>If the link expires, sign back in to your TinyBooth dashboard and start another export.</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
