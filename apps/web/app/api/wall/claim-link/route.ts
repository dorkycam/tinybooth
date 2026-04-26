/**
 * POST /api/wall/claim-link
 *
 * Capture an email address tied to an anonymous event so the creator can
 * claim ownership later. Phase 1 logs the request; Phase 3 wires SES to send
 * a real magic link.
 */
import { NextRequest, NextResponse } from 'next/server';

interface ClaimLinkBody {
  eventId?: string;
  email?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ClaimLinkBody = {};
  try {
    body = (await req.json()) as ClaimLinkBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!body.eventId || !body.email) {
    return NextResponse.json({ error: 'eventId and email are required.' }, { status: 400 });
  }
  // Phase 1: log so the dev can see captures locally. Phase 3 wires SES.
  // eslint-disable-next-line no-console
  console.info(
    `[claim-link] queued magic link for event=${body.eventId} email=${body.email}`,
  );
  return NextResponse.json({ ok: true, queued: true });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
