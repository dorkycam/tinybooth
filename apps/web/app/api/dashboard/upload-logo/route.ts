/**
 * POST /api/dashboard/upload-logo
 *
 * Owner-only multipart upload for an event's branding logo. Stores at
 * `events/{id}/branding/logo.webp` and returns the signed URL + storage key
 * so the client can persist it via `event.update`.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@tinybooth/auth';
import { db } from '../../../../src/lib/db';
import { getStorage } from '../../../../src/lib/storage';
import { processImage } from '../../../../src/lib/imageProcess';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let session;
  try {
    session = await requireSession(req.headers);
  } catch {
    return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  }

  const form = await req.formData();
  const eventId = form.get('eventId');
  if (!eventId || typeof eventId !== 'string') {
    return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
  }

  const file = form.get('logo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'logo file is required.' }, { status: 400 });
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }
  if (event.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const processed = await processImage(buf);
  const key = `events/${eventId}/branding/logo.webp`;
  const storage = getStorage();
  const stored = await storage.uploadBuffer(key, processed.buffer, processed.contentType);

  return NextResponse.json({
    url: stored.url,
    storageKey: stored.key,
    width: processed.width,
    height: processed.height,
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
