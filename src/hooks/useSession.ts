/**
 * Session hook for mobile. Loads from `expo-secure-store` on mount, exposes
 * sign-in / sign-out actions backed by `@/lib/auth`.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  clearSession,
  loadSession,
  saveSession,
  sendMagicLink as sendMagic,
  signInWithApple as appleSignIn,
  signInWithGoogle as googleSignIn,
  signOut as authSignOut,
  type MobileSession,
} from '@/lib/auth';

export interface SessionHook {
  session: MobileSession | null;
  loading: boolean;
  signInWithApple(): Promise<void>;
  signInWithGoogle(): Promise<void>;
  sendMagicLink(email: string): Promise<void>;
  signInWithDebug(userId: string, email?: string): Promise<void>;
  signOut(): Promise<void>;
}

/** Backed by SecureStore. Hydrates once on mount. */
export function useSession(): SessionHook {
  const [session, setSession] = useState<MobileSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadSession().then((s) => {
      if (cancelled) return;
      setSession(s);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signInWithApple = useCallback(async (): Promise<void> => {
    const next = await appleSignIn();
    setSession(next);
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    const next = await googleSignIn();
    setSession(next);
  }, []);

  const sendMagicLink = useCallback(async (email: string): Promise<void> => {
    await sendMagic(email);
    // The real path waits for the user to tap the email link; the dev path
    // already wrote a stub session, so re-read.
    const next = await loadSession();
    if (next) setSession(next);
  }, []);

  const signInWithDebug = useCallback(
    async (userId: string, email?: string): Promise<void> => {
      const next: MobileSession = {
        userId,
        email: email ?? null,
        accessToken: 'debug-token',
        provider: 'debug',
      };
      await saveSession(next);
      setSession(next);
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    await authSignOut();
    await clearSession();
    setSession(null);
  }, []);

  return {
    session,
    loading,
    signInWithApple,
    signInWithGoogle,
    sendMagicLink,
    signInWithDebug,
    signOut,
  };
}
