/**
 * Tests for the SMS wrapper. Local-disk fallback only; the Twilio path is
 * exercised on staging.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sendSms } from '../src/lib/sms';

beforeEach(() => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM;
});

describe('sendSms (local fallback)', () => {
  it('writes a .sms file with To/From/body', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-sms-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      const r = await sendSms({
        to: '+13105550100',
        body: 'Your strip is ready: https://x/photo.webp',
      });
      expect(r.via).toBe('local');
      const content = await readFile(r.reference, 'utf8');
      expect(content).toContain('+13105550100');
      expect(content).toContain('Your strip is ready');
    } finally {
      process.cwd = origCwd;
    }
  });

  it('handles a phone number with no alphanumeric chars', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tinybooth-sms2-'));
    const origCwd = process.cwd;
    process.cwd = (): string => dir;
    try {
      const r = await sendSms({ to: '+++', body: 'hi' });
      expect(r.via).toBe('local');
    } finally {
      process.cwd = origCwd;
    }
  });
});
