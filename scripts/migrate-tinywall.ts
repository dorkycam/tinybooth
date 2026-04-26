/**
 * TinyWall data migration (DRY RUN ONLY).
 *
 * Reads the snapshot CSVs in `data/backups/` and reports what would be
 * migrated to Supabase + R2. No writes happen here. Set `DRY_RUN = false` only
 * when Camrynn green-lights the production migration.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Hard-coded safety latch. Set to false ONLY when Camrynn green-lights migration. */
const DRY_RUN = true;

const BACKUP_PREFIX = 'tinywall-prod-20260426-015624';
const BACKUP_DIR = resolve(import.meta.dirname ?? process.cwd(), '../data/backups');

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

/**
 * Parse a CSV file into an array of row objects keyed by header name.
 * Handles quoted fields with embedded commas. Newlines inside quoted fields
 * are not handled because the TinyWall snapshot does not contain them.
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

/** Split a single CSV line, respecting double-quoted fields. */
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
async function checkReachability(urls: readonly string[]): Promise<PhotoReachability> {
  const result: PhotoReachability = { reachable: 0, broken: 0, errors: 0 };
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
          result.reachable += 1;
        } else {
          result.broken += 1;
        }
      } catch {
        result.errors += 1;
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker());
  await Promise.all(workers);
  return result;
}

/**
 * Entrypoint. Reads the three backup CSVs, prints counts, and HEAD-checks
 * every photo URL to surface broken Vercel Blob references before any real
 * migration runs.
 */
async function main(): Promise<void> {
  console.info(`[migrate-tinywall] DRY_RUN=${DRY_RUN} (set to false only when green-lit)`);
  console.info(`[migrate-tinywall] Reading from ${BACKUP_DIR}`);

  const eventCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Event.csv`), 'utf8');
  const postCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Post.csv`), 'utf8');
  const photoCsv = await readFile(resolve(BACKUP_DIR, `${BACKUP_PREFIX}-Photo.csv`), 'utf8');

  const events = parseCsv(eventCsv) as unknown as EventRow[];
  const posts = parseCsv(postCsv) as unknown as PostRow[];
  const photos = parseCsv(photoCsv) as unknown as PhotoRow[];

  console.info(`[migrate-tinywall] events: ${events.length}`);
  console.info(`[migrate-tinywall] posts:  ${posts.length}`);
  console.info(`[migrate-tinywall] photos: ${photos.length}`);

  const urls = photos.map((p) => p.url).filter((u) => u && u.length > 0);
  console.info(`[migrate-tinywall] HEAD-checking ${urls.length} photo URLs...`);

  const reach = await checkReachability(urls);
  console.info(
    `[migrate-tinywall] reachable=${reach.reachable} broken=${reach.broken} errors=${reach.errors}`,
  );

  if (DRY_RUN) {
    console.info('[migrate-tinywall] DRY_RUN is true. No writes performed.');
    return;
  }

  // Real migration would run here. Intentionally unimplemented.
  throw new Error(
    'Real migration not implemented. Wire Supabase + R2 clients and run the dry-run first.',
  );
}

main().catch((err) => {
  console.error('[migrate-tinywall] failed:', err);
  process.exitCode = 1;
});
