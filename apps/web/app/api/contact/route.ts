/**
 * POST /api/contact
 *
 * Captures a contact form submission. Phase 5 logs the message to disk
 * (under apps/web/.signups/contact-{ts}.json) so a dev can read it during
 * local work, and forwards via SES when the AWS env vars are configured
 * (sendEmail handles the branching). Real ESP integration is intentionally
 * out of scope for Phase 5.
 */
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { sendEmail } from '../../../src/lib/email';

interface ContactBody {
  name?: string;
  email?: string;
  message?: string;
}

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 2000;

/**
 * POST handler. Validates the body, persists to disk, fires an email when
 * configured. Returns 200 on success, 400 on a bad payload.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ContactBody = {};
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const name = (body.name ?? '').trim().slice(0, MAX_NAME);
  const email = (body.email ?? '').trim().slice(0, MAX_EMAIL);
  const message = (body.message ?? '').trim().slice(0, MAX_MESSAGE);
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'name, email, and message are required.' },
      { status: 400 },
    );
  }
  if (!email.includes('@')) {
    return NextResponse.json({ error: 'email must be a valid address.' }, { status: 400 });
  }

  const dir = resolve(process.cwd(), '.signups');
  await mkdir(dir, { recursive: true });
  const path = join(dir, `contact-${Date.now()}.json`);
  await writeFile(path, JSON.stringify({ name, email, message, at: new Date().toISOString() }, null, 2));

  // Best-effort: fire an email to hello@tinybooth.com. sendEmail handles the
  // SES vs local-disk branching and never throws on failure.
  await sendEmail({
    to: 'hello@tinybooth.com',
    subject: `[contact] ${name}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
<pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>`,
  }).catch(() => {
    // Swallow; the local-disk record is the persistent log.
  });

  return NextResponse.json({ ok: true });
}

/** Minimal HTML escape for the email body. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
