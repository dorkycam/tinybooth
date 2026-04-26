/**
 * Smoke tests for the email signup and contact API routes. Validates
 * the JSON-body parsing, basic validation, and the on-disk persistence.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { POST as signupPost } from '../app/api/email-signup/route';
import { POST as contactPost } from '../app/api/contact/route';

beforeEach(() => {
  delete process.env.AWS_SES_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
});

function makeReq(body: unknown): Request {
  return new Request('http://localhost/api/x', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/email-signup', () => {
  it('rejects an invalid email', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await signupPost(makeReq({ email: 'not-an-email' }) as any);
    expect(res.status).toBe(400);
  });

  it('writes a signup record to .signups when the email is valid', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-signup-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await signupPost(makeReq({ email: 'host@example.com', source: 'home' }) as any);
      expect(res.status).toBe(200);
      const files = await readdir(join(dir, '.signups'));
      expect(files.length).toBe(1);
      const written = JSON.parse(await readFile(join(dir, '.signups', files[0] ?? ''), 'utf8')) as {
        email: string;
        source: string;
      };
      expect(written.email).toBe('host@example.com');
      expect(written.source).toBe('home');
    } finally {
      process.cwd = origCwd;
    }
  });

  it('rejects an empty body', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await signupPost(makeReq({}) as any);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/contact', () => {
  it('requires name, email, and message', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await contactPost(makeReq({ name: 'a' }) as any);
    expect(res.status).toBe(400);
  });

  it('rejects an obviously bad email', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await contactPost(makeReq({ name: 'a', email: 'noatsign', message: 'hi' }) as any);
    expect(res.status).toBe(400);
  });

  it('writes a contact record to .signups when valid', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-contact-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      const res = await contactPost(
        makeReq({
          name: 'Camrynn',
          email: 'cam@example.com',
          message: 'Bug at the booth.',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      );
      expect(res.status).toBe(200);
      const files = await readdir(join(dir, '.signups'));
      const contactFile = files.find((f) => f.startsWith('contact-'));
      expect(contactFile).toBeTruthy();
      const written = JSON.parse(
        await readFile(join(dir, '.signups', contactFile ?? ''), 'utf8'),
      ) as { name: string; email: string; message: string };
      expect(written.name).toBe('Camrynn');
      expect(written.email).toBe('cam@example.com');
      expect(written.message).toBe('Bug at the booth.');
    } finally {
      process.cwd = origCwd;
    }
  });
});
