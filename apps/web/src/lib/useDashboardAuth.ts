'use client';

/**
 * Client-side auth hook for the dashboard.
 *
 * Wraps two paths:
 *   - Production: pulls the Supabase session via `@tinybooth/auth`'s
 *     browser client.
 *   - Local dev (no Supabase envs): the `signInWithDebug` action persists a
 *     debug user id to localStorage so the dashboard works without a backend.
 *
 * The shape returned is a small adapter (debugUserId/accessToken) consumed by
 * `dashboardApi.trpcQuery/trpcMutation`.
 */
import { useCallback, useEffect, useState } from 'react';
import { createSupabaseBrowserClient, supabaseConfigured } from '@tinybooth/auth';

const DEBUG_USER_KEY = 'tinybooth.debugUserId';
const DEBUG_EMAIL_KEY = 'tinybooth.debugUserEmail';

export interface DashboardSession {
  userId: string | null;
  email: string | null;
  accessToken: string | null;
  debugUserId: string | null;
  debugUserEmail: string | null;
  loading: boolean;
}

export interface DashboardAuth extends DashboardSession {
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithDebug: (userId: string, email?: string) => void;
  signOut: () => Promise<void>;
}

/**
 * Read + manage the dashboard's auth state. Always returns a stable shape;
 * `loading` flips true while the initial session resolves.
 */
export function useDashboardAuth(): DashboardAuth {
  const [state, setState] = useState<DashboardSession>({
    userId: null,
    email: null,
    accessToken: null,
    debugUserId: null,
    debugUserEmail: null,
    loading: true,
  });

  // Hydrate from Supabase or localStorage on mount.
  useEffect(() => {
    let cancelled = false;
    const hydrate = async (): Promise<void> => {
      const sb = createSupabaseBrowserClient();
      if (sb) {
        const { data } = await sb.auth.getSession();
        if (cancelled) return;
        const session = data.session;
        setState({
          userId: session?.user.id ?? null,
          email: session?.user.email ?? null,
          accessToken: session?.access_token ?? null,
          debugUserId: null,
          debugUserEmail: null,
          loading: false,
        });
        return;
      }
      // Local dev fallback. Read from localStorage; SSR-safe via guard.
      if (typeof window === 'undefined') {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }
      const userId = window.localStorage.getItem(DEBUG_USER_KEY);
      const email = window.localStorage.getItem(DEBUG_EMAIL_KEY);
      setState({
        userId,
        email,
        accessToken: null,
        debugUserId: userId,
        debugUserEmail: email,
        loading: false,
      });
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithApple = useCallback(async (): Promise<void> => {
    const sb = createSupabaseBrowserClient();
    if (!sb) throw new Error('Supabase not configured. Use sign-in-with-debug in dev.');
    await sb.auth.signInWithOAuth({ provider: 'apple' });
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const sb = createSupabaseBrowserClient();
    if (!sb) throw new Error('Supabase not configured. Use sign-in-with-debug in dev.');
    await sb.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const sendMagicLink = useCallback(async (email: string): Promise<void> => {
    const sb = createSupabaseBrowserClient();
    if (!sb) throw new Error('Supabase not configured. Use sign-in-with-debug in dev.');
    await sb.auth.signInWithOtp({ email });
  }, []);

  const signInWithDebug = useCallback((userId: string, email?: string): void => {
    if (supabaseConfigured()) {
      throw new Error('Debug sign-in disabled when Supabase is configured.');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEBUG_USER_KEY, userId);
      if (email) window.localStorage.setItem(DEBUG_EMAIL_KEY, email);
    }
    setState({
      userId,
      email: email ?? null,
      accessToken: null,
      debugUserId: userId,
      debugUserEmail: email ?? null,
      loading: false,
    });
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const sb = createSupabaseBrowserClient();
    if (sb) {
      await sb.auth.signOut();
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DEBUG_USER_KEY);
      window.localStorage.removeItem(DEBUG_EMAIL_KEY);
    }
    setState({
      userId: null,
      email: null,
      accessToken: null,
      debugUserId: null,
      debugUserEmail: null,
      loading: false,
    });
  }, []);

  return {
    ...state,
    signInWithApple,
    signInWithGoogle,
    sendMagicLink,
    signInWithDebug,
    signOut,
  };
}
