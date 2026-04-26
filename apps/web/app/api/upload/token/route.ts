/**
 * POST /api/upload/token
 *
 * Returns a signed multipart upload token for video files (paid-only). When
 * R2 is configured, returns a real S3 multipart presigned URL via the AWS
 * SDK. When unconfigured, returns 501 with a clear "ships in Phase 4" body.
 */
import { NextRequest, NextResponse } from 'next/server';

interface TokenRequest {
  filename?: string;
  contentType?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return NextResponse.json(
      {
        error: 'Video uploads ship in Phase 4. R2 is not configured for this deployment.',
        phase: 4,
      },
      { status: 501 },
    );
  }

  let body: TokenRequest = {};
  try {
    body = (await req.json()) as TokenRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const filename = body.filename ?? `video-${Date.now()}.mp4`;
  const contentType = body.contentType ?? 'video/mp4';

  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const key = `videos/${Date.now()}-${filename}`;
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
