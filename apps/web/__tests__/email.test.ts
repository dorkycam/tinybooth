/**
 * Tests for the email helper. Local-disk path is exercised directly; the SES
 * path is gated behind envs and verified by checking we don't try to send
 * when envs are missing.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sendEmail } from '../src/lib/email';

beforeEach(() => {
  delete process.env.AWS_SES_REGION;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
});

describe('sendEmail (local fallback)', () => {
  it('writes the payload to .emails/ and returns a local reference', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-email-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      const result = await sendEmail({
        to: 'host@example.com',
        subject: 'Your TinyBooth export is ready',
        html: '<p>Tap to download.</p>',
      });
      expect(result.via).toBe('local');
      expect(result.reference).toMatch(/\.emails/);
      const files = await readdir(join(dir, '.emails'));
      expect(files.length).toBe(1);
      const written = await readFile(result.reference, 'utf8');
      expect(written).toContain('host@example.com');
      expect(written).toContain('Tap to download.');
    } finally {
      process.cwd = origCwd;
    }
  });

  it('escapes HTML in the headers', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-email-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      const result = await sendEmail({
        to: '"a"<b>@c.example.com',
        subject: 'a&b<c>',
        html: '<p>ok</p>',
      });
      const written = await readFile(result.reference, 'utf8');
      expect(written).toContain('&quot;a&quot;&lt;b&gt;');
      expect(written).toContain('a&amp;b&lt;c&gt;');
    } finally {
      process.cwd = origCwd;
    }
  });
});
