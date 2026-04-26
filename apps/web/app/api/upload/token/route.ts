/**
 * POST /api/upload/token
 *
 * Returns a signed multipart upload token for video files. Paid-only: the
 * caller must own a paid event (Event Pass or Event Pass Plus). When R2 is
 * not configured we still return a stub token in dev so the rest of the flow
 * is testable end to end.
 */
import { NextRequest, NextResponse } from 'next/server';
import { evaluateEvent } from '@tinybooth/billing';
import { getSession } from '@tinybooth/auth';
import { db } from '../../../../src/lib/db';

interface TokenRequest {
  eventId?: string;
  filename?: string;
  contentType?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req.headers);
  if (!session) {
    return NextResponse.json({ error: 'Sign-in required.' }, { status: 401 });
  }

  let body: TokenRequest = {};
  try {
    body = (await req.json()) as TokenRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.eventId) {
    return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
  }
  const event = await db.event.findUnique({ where: { id: body.eventId } });
  if (!event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
  }
  if (event.ownerId && event.ownerId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  }
  const ent = evaluateEvent({
    id: event.id,
    tier: event.tier,
    endsAt: event.endsAt,
    createdAt: event.createdAt,
    emailDeliveries: event.emailDeliveries,
    smsDeliveries: event.smsDeliveries,
  });
  if (!ent.videoUploadsAllowed) {
    return NextResponse.json(
      {
        error: 'Video uploads require Event Pass or Event Pass Plus.',
        code: 'TIER_REQUIRED',
        requiredTier: 'EVENT_PASS',
      },
      { status: 403 },
    );
  }

  const filename = body.filename ?? `video-${Date.now()}.mp4`;
  const contentType = body.contentType ?? 'video/mp4';

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    // Local-dev stub: a placeholder URL the mobile uploader can pretend to PUT
    // to. The cron cleanup ignores keys that don't exist in storage.
    const key = `videos/${event.id}/${Date.now()}-${filename}`;
    return NextResponse.json({
      uploadUrl: `https://stub.tinybooth.local/${key}`,
      key,
      contentType,
      stub: true,
    });
  }

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `videos/${event.id}/${Date.now()}-${filename}`;
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });

  return NextResponse.json({ uploadUrl: signedUrl, key, contentType });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
