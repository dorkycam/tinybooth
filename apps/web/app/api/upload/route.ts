/**
 * POST /api/upload
 *
 * Multipart endpoint for image uploads. Up to 10 files, each processed by
 * Sharp (auto-rotate, resize 2048px, WebP @ 80%) and stored via the storage
 * abstraction (R2 in prod, local disk in dev). Per-IP rate limited.
 */
import { NextRequest, NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';
import { getStorage } from '../../../src/lib/storage';
import { processImage } from '../../../src/lib/imageProcess';
import { getLimiter } from '../../../src/lib/rateLimit';

const idGen = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
const MAX_FILES = 10;

interface UploadResponseRow {
  url: string;
  storageKey: string;
  mediaType: 'image';
  width: number;
  height: number;
}

/**
 * Resolve the caller's IP address from request headers. Falls back to a
 * sentinel so the limiter still keys per-process if headers are missing.
 */
function resolveIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = resolveIp(req);
    const limiter = getLimiter();
    const lim = await limiter.limit(`upload:${ip}`);
    if (!lim.success) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const form = await req.formData();
    const eventSlug = form.get('eventSlug');
    if (!eventSlug || typeof eventSlug !== 'string' || eventSlug.length === 0) {
      return NextResponse.json({ error: 'eventSlug is required.' }, { status: 400 });
    }

    const files = form
      .getAll('photos')
      .filter((v): v is File => v instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one photo is required.' }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files per upload.` },
        { status: 400 },
      );
    }

    const storage = getStorage();
    const out: UploadResponseRow[] = [];
    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const processed = await processImage(buf);
      const key = `events/${eventSlug}/uploads/${Date.now()}-${idGen()}.webp`;
      const stored = await storage.uploadBuffer(key, processed.buffer, processed.contentType);
      out.push({
        url: stored.url,
        storageKey: stored.key,
        mediaType: 'image',
        width: processed.width,
        height: processed.height,
      });
    }

    return NextResponse.json({ photos: out });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[upload] failed:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
