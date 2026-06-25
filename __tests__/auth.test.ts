import { describe, expect, it, beforeEach } from 'vitest';
import {
  __resetSecureForTests,
} from '../src/lib/secureStore';
import {
  clearSession,
  loadSession,
  saveSession,
  sendMagicLink,
  signInWithApple,
  signInWithGoogle,
  signOut,
  type MobileSession,
} from '../src/lib/auth';

beforeEach(() => {
  __resetSecureForTests();
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

const sample: MobileSession = {
  userId: 'u1',
  email: 'host@example.com',
  accessToken: 'tok',
  provider: 'apple',
};

describe('auth session persistence', () => {
  it('loadSession returns null before any save', async () => {
    expect(await loadSession()).toBeNull();
  });

  it('saveSession + loadSession round-trip', async () => {
    await saveSession(sample);
    const loaded = await loadSession();
    expect(loaded).toEqual(sample);
  });

  it('clearSession drops the persisted record', async () => {
    await saveSession(sample);
    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it('signOut clears session', async () => {
    await saveSession(sample);
    await signOut();
    expect(await loadSession()).toBeNull();
  });
});

describe('auth dev fallbacks', () => {
  it('signInWithApple writes a stub session when supabase envs are absent', async () => {
    const session = await signInWithApple();
    expect(session.provider).toBe('apple');
    expect(session.accessToken).toBe('stub-token-apple');
    expect(await loadSession()).not.toBeNull();
  });

  it('signInWithGoogle writes a stub session when supabase envs are absent', async () => {
    const session = await signInWithGoogle();
    expect(session.provider).toBe('google');
    expect(session.accessToken).toBe('stub-token-google');
  });

  it('sendMagicLink writes a stub session when envs are absent', async () => {
    await sendMagicLink('me@example.com');
    const loaded = await loadSession();
    expect(loaded?.provider).toBe('magic_link');
    expect(loaded?.email).toBe('me@example.com');
  });
});
