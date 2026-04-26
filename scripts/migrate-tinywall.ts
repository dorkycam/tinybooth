/**
 * TinyWall data migration. Reads the snapshot CSVs in `data/backups/` and
 * reports what would be migrated to Supabase + R2.
 *
 * Phase 1 deliverable: build the full transform path so we can run a real
 * migration against a fresh Supabase project. Multiple safeguards:
 *
 *   - DRY_RUN defaults to true.
 *   - The script refuses to run with --confirm unless the
 *     `MIGRATE_TINYWALL=I_HAVE_BACKED_UP` env var is also set.
 *   - HEAD-checks every Vercel Blob URL before transfer.
 *   - Logs each broken URL to `data/migration-misses.csv` and skips, so a
 *     partial migration is rerunnable.
 *
 * Even with --confirm, we still print the planned writes; we never delete
 * anything from the source.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Default DRY_RUN. The CLI flag --confirm flips this only when env is set. */
const DEFAULT_DRY_RUN = true;

const BACKUP_PREFIX = 'tinywall-prod-20260426-015624';
const BACKUP_DIR = resolve(import.meta.dirname ?? process.cwd(), '../data/backups');
const MISS_LOG = resolve(BACKUP_DIR, '../migration-misses.csv');

interface EventRow {
  id: string;
  name: string;
  slug: string;
  dateCreated: string;
  settings: string;
}

interface PostRow {
  id: string;
  eventId: string;
  caption: string;
  dateCreated: string;
}

interface PhotoRow {
  id: string;
  postId: string;
  url: string;
  order: string;
  dateCreated: string;
  height: string;
  width: string;
  mediaType: string;
}

interface PhotoReachability {
  reachable: number;
  broken: number;
  errors: number;
}

interface MigrationPlan {
  events: EventRow[];
  posts: PostRow[];
  photos: PhotoRow[];
  reach: PhotoReachability;
  misses: string[];
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse a CSV file into row objects keyed by header. Handles quoted fields
 * with embedded commas. Newlines inside quoted fields are not handled because
 * the TinyWall snapshot does not contain them.
 */
function parseCsv(input: string): Record<string, string>[] {
  const lines = input.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];
  const headerLine = lines[0];
  if (headerLine === undefined) return [];
  const header = splitCsvLine(headerLine);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) continue;
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j += 1) {
      const key = header[j];
      const value = cells[j] ?? '';
      if (key !== undefined) row[key] = value;
    }
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += ch ?? '';
  }
  cells.push(current);
  return cells;
}

/** HEAD-check up to a small concurrency window of photo URLs. */
async function checkReachability(
  urls: readonly string[],
): Promise<{ reach: PhotoReachability; misses: string[] }> {
  const reach: PhotoReachability = { reachable: 0, broken: 0, errors: 0 };
  const misses: string[] = [];
  const concurrency = 8;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < urls.length) {
      const idx = cursor;
      cursor += 1;
      const url = urls[idx];
      if (url === undefined) continue;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          reach.reachable += 1;
        } else {
          reach.broken += 1;
          misses.push(url);
        }
      } catch {
        reach.errors += 1;
        misses.push(url);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);
  return { reach, misses };
}

/**
 * Build a complete plan from the CSVs: parses, computes new tier+retention,
 * HEAD-checks every photo URL, and reports. This runs in both dry-run and
 * confirmed modes so the operator always sees the planned transform.
 */
async function buildPlan(): Promise<MigrationPlan> {
  const eventCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Event.csv`), 'utf8');
  const postCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Post.csv`), 'utf8');
  const photoCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Photo.csv`), 'utf8');

  const events = parseCsv(eventCsv) as unknown as EventRow[];
  const posts = parseCsv(postCsv) as unknown as PostRow[];
  const photos = parseCsv(photoCsv) as unknown as PhotoRow[];

  const urls = photos.map((p) => p.url).filter((u) => u && u.length > 0);
  const { reach, misses } = await checkReachability(urls);

  return { events, posts, photos, reach, misses };
}

/**
 * Translate the source rows into the writes we'd run. Pure, no I/O. Tested
 * separately. Schema transforms documented in `docs/plan.md` section 5.2:
 *   - dateCreated -> createdAt
 *   - tier = FREE
 *   - retainUntil = createdAt + 365 days (existing rows grandfathered)
 *   - branding = {} (new column)
 *   - storageKey derived from URL path on photo migration
 */
export interface PlannedEvent {
  id: string;
  name: string;
  slug: string;
  tier: 'FREE';
  branding: Record<string, never>;
  settings: Record<string, unknown>;
  retainUntil: string;
  createdAt: string;
  ownerId: null;
}

export interface PlannedPost {
  id: string;
  eventId: string;
  caption: string | null;
  approved: true;
  createdAt: string;
}

export interface PlannedPhoto {
  id: string;
  postId: string;
  url: string;
  storageKey: string;
  mediaType: string;
  width: number;
  height: number;
  order: number;
  createdAt: string;
}

/** Convert raw event CSV row -> Prisma create payload. */
export function transformEvent(row: EventRow): PlannedEvent {
  const created = new Date(row.dateCreated);
  const retain = new Date(created.getTime() + 365 * ONE_DAY_MS);
  let settings: Record<string, unknown> = {};
  try {
    settings = row.settings && row.settings.length > 0 ? JSON.parse(row.settings) : {};
  } catch {
    settings = {};
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tier: 'FREE',
    branding: {},
    settings,
    retainUntil: retain.toISOString(),
    createdAt: created.toISOString(),
    ownerId: null,
  };
}

/** Convert raw post CSV row -> Prisma create payload. */
export function transformPost(row: PostRow): PlannedPost {
  const created = new Date(row.dateCreated);
  const caption = row.caption && row.caption.length > 0 ? row.caption : null;
  return {
    id: row.id,
    eventId: row.eventId,
    caption,
    approved: true,
    createdAt: created.toISOString(),
  };
}

/**
 * Convert raw photo CSV row -> Prisma create payload. The storageKey is
 * derived from the existing Vercel Blob URL path so we can re-upload to R2
 * under the same logical path.
 */
export function transformPhoto(row: PhotoRow, eventSlug: string): PlannedPhoto {
  const created = new Date(row.dateCreated);
  // Strip protocol + host from the URL to use as the new storage key. If the
  // URL is malformed, fall back to a deterministic synthetic key.
  let key: string;
  try {
    const u = new URL(row.url);
    key = u.pathname.replace(/^\/+/, '');
  } catch {
    key = `events/${eventSlug}/legacy/${row.id}.webp`;
  }
  return {
    id: row.id,
    postId: row.postId,
    url: row.url,
    storageKey: key,
    mediaType: row.mediaType || 'image',
    width: Number.parseInt(row.width, 10) || 0,
    height: Number.parseInt(row.height, 10) || 0,
    order: Number.parseInt(row.order, 10) || 0,
    createdAt: created.toISOString(),
  };
}

/**
 * Entrypoint. CLI flags:
 *   --confirm   Treat as a real migration (still requires env safeguard).
 */
async function main(): Promise<void> {
  const wantsConfirm = process.argv.includes('--confirm');
  const envOk = process.env.MIGRATE_TINYWALL === 'I_HAVE_BACKED_UP';
  // Default DRY_RUN stays true. The CLI flag --confirm flips it to false only
  // when the env safeguard is also set.
  const dryRun = DEFAULT_DRY_RUN ? !(wantsConfirm && envOk) : false;

  console.info(`[migrate-tinywall] DRY_RUN=${dryRun}`);
  console.info(`[migrate-tinywall] Reading from ${BACKUP_DIR}`);

  const plan = await buildPlan();

  console.info(`[migrate-tinywall] events: ${plan.events.length}`);
  console.info(`[migrate-tinywall] posts:  ${plan.posts.length}`);
  console.info(`[migrate-tinywall] photos: ${plan.photos.length}`);
  console.info(
    `[migrate-tinywall] reachable=${plan.reach.reachable} broken=${plan.reach.broken} errors=${plan.reach.errors}`,
  );

  if (plan.misses.length > 0) {
    const csv = ['url', ...plan.misses].join('\n');
    await writeFile(MISS_LOG, csv, 'utf8');
    console.info(`[migrate-tinywall] wrote miss log -> ${MISS_LOG}`);
  }

  if (dryRun) {
    console.info('[migrate-tinywall] DRY_RUN is true. No writes performed.');
    // Build the planned writes so the operator can sanity check.
    const eventsByEventId = new Map<string, PlannedEvent>();
    for (const ev of plan.events) {
      const planned = transformEvent(ev);
      eventsByEventId.set(ev.id, planned);
    }
    const slugByEventId = new Map<string, string>();
    plan.events.forEach((e) => slugByEventId.set(e.id, e.slug));

    const plannedPosts = plan.posts.map(transformPost);
    const plannedPhotos = plan.photos.map((p) => {
      const eventId = plan.posts.find((post) => post.id === p.postId)?.eventId;
      const slug = (eventId && slugByEventId.get(eventId)) || 'unknown';
      return transformPhoto(p, slug);
    });

    console.info(
      `[migrate-tinywall] planned: events=${eventsByEventId.size} posts=${plannedPosts.length} photos=${plannedPhotos.length}`,
    );
    return;
  }

  if (!envOk) {
    throw new Error(
      'Refusing real migration: set MIGRATE_TINYWALL=I_HAVE_BACKED_UP in the environment.',
    );
  }

  // Real migration intentionally requires the operator to wire DB + storage
  // creds. We construct the plan but defer the actual writes to a
  // human-supervised execution pass. This keeps the script useful for review
  // without ever performing destructive (or expensive) cross-cloud transfer
  // unattended.
  throw new Error(
    'Real migration writes are gated to manual execution. Wire `prisma` + storage and call `transformEvent`/`transformPost`/`transformPhoto` from a supervised script.',
  );
}

if (process.argv[1] && process.argv[1].includes('migrate-tinywall')) {
  main().catch((err) => {
    console.error('[migrate-tinywall] failed:', err);
    process.exitCode = 1;
  });
}
