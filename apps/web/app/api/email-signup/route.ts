/**
 * POST /api/email-signup
 *
 * Captures a marketing-list email address. Phase 5 writes a JSON record to
 * apps/web/.signups so a dev can read what was captured. Real ESP wiring
 * is intentionally deferred; switch the writeFile call for an ESP API
 * call when Camrynn picks one.
 */
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

interface SignupBody {
  email?: string;
  source?: string;
}

const MAX_EMAIL = 254;
const MAX_SOURCE = 60;

/** POST handler. Returns 200 on success, 400 on a bad payload. */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SignupBody = {};
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const email = (body.email ?? '').trim().slice(0, MAX_EMAIL).toLowerCase();
  const source = (body.source ?? 'unknown').trim().slice(0, MAX_SOURCE);
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email must be a valid address.' }, { status: 400 });
  }
  const dir = resolve(process.cwd(), '.signups');
  await mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${email.replace(/[^a-z0-9]+/g, '-')}.json`;
  const path = join(dir, filename);
  await writeFile(
    path,
    JSON.stringify({ email, source, at: new Date().toISOString() }, null, 2),
  );
  return NextResponse.json({ ok: true });
}

export const dynamic = 'force-dynamic';
