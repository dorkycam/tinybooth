/**
 * Auth client factory tests. Only verifies the env-gating: when envs are
 * missing the factories return null instead of throwing, which keeps every
 * caller's local-dev path simple.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  createSupabaseBrowserClient,
  createSupabaseServerClient,
  supabaseConfigured,
} from '../src/client';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

describe('supabaseConfigured', () => {
  it('returns false when envs are missing', () => {
    expect(supabaseConfigured()).toBe(false);
  });

  it('returns true when both envs are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(supabaseConfigured()).toBe(true);
  });

  it('returns false when one of the envs is empty', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    expect(supabaseConfigured()).toBe(false);
  });
});

describe('createSupabaseBrowserClient', () => {
  it('returns null when envs are missing', () => {
    expect(createSupabaseBrowserClient()).toBeNull();
  });

  it('returns a client when envs are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const client = createSupabaseBrowserClient();
    expect(client).not.toBeNull();
    expect(typeof client?.auth.signInWithOtp).toBe('function');
  });
});

describe('createSupabaseServerClient', () => {
  it('returns null when envs are missing', () => {
    expect(createSupabaseServerClient()).toBeNull();
  });

  it('returns a client when envs are set, with or without an access token', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    expect(createSupabaseServerClient(null)).not.toBeNull();
    expect(createSupabaseServerClient('token-abc')).not.toBeNull();
  });
});
