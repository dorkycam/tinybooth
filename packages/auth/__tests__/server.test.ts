/**
 * Auth server helper tests. The Supabase round-trip is mocked out; we focus on
 * the dev-fallback path and the bearer-token parser.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  AuthRequiredError,
  DEBUG_EMAIL_HEADER,
  DEBUG_USER_HEADER,
  getSession,
  readBearerToken,
  requireSession,
} from '../src/server';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readBearerToken', () => {
  it('returns the token when the Authorization header is well-formed', () => {
    const headers = new Headers({ authorization: 'Bearer abc.def.ghi' });
    expect(readBearerToken(headers)).toBe('abc.def.ghi');
  });

  it('returns null when the header is missing', () => {
    const headers = new Headers();
    expect(readBearerToken(headers)).toBeNull();
  });

  it('returns null when the scheme is not Bearer', () => {
    const headers = new Headers({ authorization: 'Basic abc' });
    expect(readBearerToken(headers)).toBeNull();
  });

  it('returns null when the header has no token segment', () => {
    const headers = new Headers({ authorization: 'Bearer ' });
    expect(readBearerToken(headers)).toBeNull();
  });

  it('honors the capitalized header name', () => {
    const headers = new Headers({ Authorization: 'Bearer xyz' });
    expect(readBearerToken(headers)).toBe('xyz');
  });
});

describe('getSession (debug fallback)', () => {
  it('returns null when neither envs nor the debug header are present', async () => {
    const session = await getSession(new Headers());
    expect(session).toBeNull();
  });

  it('returns a synthetic session when the debug header is present in dev', async () => {
    const headers = new Headers({ [DEBUG_USER_HEADER]: 'user-42' });
    const session = await getSession(headers);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user-42');
    expect(session?.user.email).toBeNull();
    expect(session?.accessToken).toBe('debug-token');
  });

  it('exposes the debug email header when provided', async () => {
    const headers = new Headers({
      [DEBUG_USER_HEADER]: 'user-42',
      [DEBUG_EMAIL_HEADER]: 'host@example.com',
    });
    const session = await getSession(headers);
    expect(session?.user.email).toBe('host@example.com');
  });

  it('refuses to honor the debug header in production', async () => {
    process.env.NODE_ENV = 'production';
    const headers = new Headers({ [DEBUG_USER_HEADER]: 'user-42' });
    const session = await getSession(headers);
    expect(session).toBeNull();
  });
});

describe('getSession (supabase path)', () => {
  it('returns null when supabase is configured but no bearer is sent and no debug header', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const session = await getSession(new Headers());
    expect(session).toBeNull();
  });

  it('still honors the debug header when supabase configured but the user did not send a bearer', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const headers = new Headers({ [DEBUG_USER_HEADER]: 'dev-1' });
    const session = await getSession(headers);
    expect(session?.userId).toBe('dev-1');
  });
});

describe('requireSession', () => {
  it('throws AuthRequiredError when no session is present', async () => {
    await expect(requireSession(new Headers())).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it('returns the session when the debug header is present', async () => {
    const headers = new Headers({ [DEBUG_USER_HEADER]: 'u1' });
    const session = await requireSession(headers);
    expect(session.userId).toBe('u1');
  });
});
