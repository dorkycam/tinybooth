import { describe, expect, it, beforeEach } from 'vitest';
import { __resetSecureForTests } from '../src/lib/secureStore';
import {
  loadConnection,
  saveConnection,
  clearConnection,
  parsePairingPayload,
  type EventConnection,
} from '../src/lib/eventConnection';

beforeEach(() => {
  __resetSecureForTests();
});

const sample: EventConnection = {
  eventId: 'ev_1',
  eventName: 'Mya 30',
  slug: 'mya-30-x',
  branding: { primaryColor: '#FF0000' },
  connectedAt: new Date('2026-04-26T00:00:00Z').toISOString(),
};

describe('eventConnection persistence', () => {
  it('round-trips through SecureStore', async () => {
    expect(await loadConnection()).toBeNull();
    await saveConnection(sample);
    const out = await loadConnection();
    expect(out?.eventId).toBe('ev_1');
    expect(out?.branding.primaryColor).toBe('#FF0000');
    await clearConnection();
    expect(await loadConnection()).toBeNull();
  });

  it('returns null when stored payload is corrupt', async () => {
    // Direct write of a non-JSON string via the underlying SecureStore stub.
    const { writeSecure } = await import('../src/lib/secureStore');
    await writeSecure('@tinybooth/event/connection', '{not json');
    expect(await loadConnection()).toBeNull();
  });
});

describe('parsePairingPayload', () => {
  it('parses the canonical tinybooth://event?id=...&code=... payload', () => {
    const out = parsePairingPayload('tinybooth://event?id=abc&code=xyz123');
    expect(out).toEqual({ eventId: 'abc', pairingCode: 'xyz123' });
  });

  it('returns null on a non-tinybooth payload', () => {
    expect(parsePairingPayload('https://example.com')).toBeNull();
  });

  it('returns null when id or code is missing', () => {
    expect(parsePairingPayload('tinybooth://event?id=abc')).toBeNull();
    expect(parsePairingPayload('tinybooth://event?code=xyz')).toBeNull();
  });

  it('returns null on malformed input', () => {
    expect(parsePairingPayload('not-a-url')).toBeNull();
  });
});
