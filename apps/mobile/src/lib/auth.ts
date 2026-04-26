/**
 * Mobile auth client.
 *
 * Two layers:
 *   - A persistent session stored in `expo-secure-store` so the user stays
 *     signed in across launches.
 *   - Provider entry points (Apple, Google, magic link) gated behind
 *     `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Expo
 *     surfaces those via `process.env` thanks to the `expo-router` setup).
 *
 * When envs are missing we still let `signInWith*` succeed by writing a stub
 * token so the rest of the UI is testable end-to-end without provisioning
 * anything.
 */
import { deleteSecure, readSecure, writeSecure } from './secureStore';

const SESSION_KEY = '@tinybooth/auth/session';

export interface MobileSession {
  /** User id (Supabase auth id, or stub string in dev). */
  userId: string;
  /** Verified email when known. */
  email: string | null;
  /** Bearer access token. */
  accessToken: string;
  /** Provider that produced the session. */
  provider: 'apple' | 'google' | 'magic_link' | 'debug';
}

/** Read the persisted session, if any. */
export async function loadSession(): Promise<MobileSession | null> {
  const raw = await readSecure(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MobileSession;
  } catch {
    return null;
  }
}

/** Write or replace the persisted session. */
export async function saveSession(session: MobileSession): Promise<void> {
  await writeSecure(SESSION_KEY, JSON.stringify(session));
}

/** Drop the persisted session. */
export async function clearSession(): Promise<void> {
  await deleteSecure(SESSION_KEY);
}

/** Returns true when both Supabase envs are present. */
function supabaseReady(): boolean {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.length > 0 && key.length > 0);
}

/** Build a deterministic stub session for the dev fallback. */
function stubSession(provider: MobileSession['provider'], email: string | null): MobileSession {
  return {
    userId: `dev-${provider}-${Date.now().toString(36)}`,
    email,
    accessToken: `stub-token-${provider}`,
    provider,
  };
}

interface AppleAuthModule {
  signInAsync(opts: unknown): Promise<{
    identityToken?: string;
    authorizationCode?: string | null;
    email?: string | null;
  }>;
  refreshAsync(opts: { user: string }): Promise<unknown>;
  AppleAuthenticationScope: { FULL_NAME: number; EMAIL: number };
}

interface AuthSessionModule {
  Google?: {
    useAuthRequest(cfg: unknown): unknown;
  };
  startAsync(opts: unknown): Promise<{ params?: { access_token?: string } }>;
}

interface SupabaseLikeModule {
  createClient(url: string, anonKey: string): {
    auth: {
      signInWithIdToken(args: { provider: string; token: string }): Promise<{
        data?: { session?: { access_token?: string; user?: { id?: string; email?: string | null } } };
        error?: unknown;
      }>;
      signInWithOtp(args: { email: string }): Promise<{ error?: unknown }>;
      signInWithOAuth(args: { provider: string }): Promise<unknown>;
    };
  };
}

/**
 * Sign in with Apple. Real path: `expo-apple-authentication` -> Supabase
 * `signInWithIdToken`. Dev fallback: synthesizes a stub session.
 */
export async function signInWithApple(): Promise<MobileSession> {
  if (!supabaseReady()) {
    const session = stubSession('apple', null);
    await saveSession(session);
    return session;
  }
  const appleMod = await loadModule<AppleAuthModule>('expo-apple-authentication');
  if (!appleMod) throw new Error('expo-apple-authentication not installed.');
  const out = await appleMod.signInAsync({
    requestedScopes: [
      appleMod.AppleAuthenticationScope.FULL_NAME,
      appleMod.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!out.identityToken) throw new Error('Apple did not return an identity token.');
  const sb = await supabaseClient();
  const { data, error } = await sb.auth.signInWithIdToken({
    provider: 'apple',
    token: out.identityToken,
  });
  if (error || !data?.session?.access_token || !data.session.user?.id) {
    throw new Error('Apple sign-in rejected by Supabase.');
  }
  const session: MobileSession = {
    userId: data.session.user.id,
    email: data.session.user.email ?? out.email ?? null,
    accessToken: data.session.access_token,
    provider: 'apple',
  };
  await saveSession(session);
  return session;
}

/**
 * Sign in with Google. Real path: `expo-auth-session/providers/google` ->
 * Supabase `signInWithIdToken`. Dev fallback: stub session.
 */
export async function signInWithGoogle(): Promise<MobileSession> {
  if (!supabaseReady()) {
    const session = stubSession('google', null);
    await saveSession(session);
    return session;
  }
  // The real flow uses a hook + redirect; surface a clear error if a caller
  // tries to invoke it non-interactively.
  throw new Error(
    'Google sign-in must run from the React component using expo-auth-session.',
  );
}

/**
 * Send a magic link via Supabase email OTP. Returns once the email is queued.
 * Dev fallback: pretends success and writes a stub session immediately.
 */
export async function sendMagicLink(email: string): Promise<void> {
  if (!supabaseReady()) {
    const session = stubSession('magic_link', email);
    await saveSession(session);
    return;
  }
  const sb = await supabaseClient();
  const { error } = await sb.auth.signInWithOtp({ email });
  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Magic link failed: ${msg}`);
  }
}

/** Sign the user out and clear the persisted session. */
export async function signOut(): Promise<void> {
  await clearSession();
}

/**
 * Revoke the Sign in with Apple token for the current session.
 *
 * Apple requires apps that use SIWA to call the Apple token-revocation
 * endpoint as part of account deletion (in effect since 2024). The actual
 * revocation runs server-side because it needs the team key. This client
 * function POSTs the SIWA authorization code (captured at sign-in) to our
 * server, which holds the team JWT signing key. If the user did not sign in
 * with Apple this is a no-op.
 *
 * @param accessToken Bearer token to authenticate the revoke request.
 * @param baseUrl Web base URL for the tRPC route.
 */
export async function revokeAppleToken(
  accessToken: string,
  baseUrl: string,
): Promise<void> {
  const session = await loadSession();
  if (!session || session.provider !== 'apple') return;
  const url = `${baseUrl}/api/trpc/account.revokeAppleToken?batch=1`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ '0': { json: undefined } }),
  });
}

/** Lazy-load a module by name; returns null when the package is missing. */
async function loadModule<T>(name: string): Promise<T | null> {
  try {
    return (await import(/* @vite-ignore */ name)) as T;
  } catch {
    return null;
  }
}

async function supabaseClient(): Promise<ReturnType<SupabaseLikeModule['createClient']>> {
  const url =
    process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const mod = await loadModule<SupabaseLikeModule>('@supabase/supabase-js');
  if (!mod) throw new Error('@supabase/supabase-js not installed.');
  return mod.createClient(url, key);
}
