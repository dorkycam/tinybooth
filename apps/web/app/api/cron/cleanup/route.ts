/**
 * GET /api/cron/cleanup
 *
 * Vercel Cron handler. Finds events past `retainUntil`, deletes their photos
 * from object storage, then deletes the rows. Cascading Prisma relations take
 * care of posts/strips/photos in the DB.
 *
 * Schedule: hourly via vercel.json.
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/lib/db';
import { getStorage } from '../../../../src/lib/storage';
import { runCleanup, type CleanupSummary } from '../../../../src/lib/cleanup';

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Vercel Cron sends a bearer token; if a secret is configured, enforce it.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }
  const summary: CleanupSummary = await runCleanup({ db, storage: getStorage(), now: new Date() });
  return NextResponse.json(summary);
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
