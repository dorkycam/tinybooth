/**
 * Server-side session helpers.
 *
 * `getSession` returns the resolved session for a request, or null when the
 * caller is anonymous. `requireSession` throws when the caller is anonymous.
 *
 * Two paths:
 *   1. Production / staging: Supabase envs set. We pull the bearer token off
 *      the Authorization header and call `auth.getUser()` for verification.
 *   2. Local dev: envs missing. We honor an `x-debug-user-id` header so the
 *      tRPC stubs and Vitest suites work without provisioning Supabase. The
 *      debug header is ignored in production (NODE_ENV check) so a misconfigured
 *      deploy can never turn into an auth bypass.
 */
import { createSupabaseServerClient, supabaseConfigured } from './client';
import type { AuthUser, Session } from './types';

/** Header consulted only when Supabase envs are absent and NODE_ENV !== 'production'. */
export const DEBUG_USER_HEADER = 'x-debug-user-id';
/** Optional override for the email exposed by the debug-header path. */
export const DEBUG_EMAIL_HEADER = 'x-debug-user-email';

/**
 * Pull the bearer token off an Authorization header. Returns null if the
 * header is missing or malformed.
 */
export function readBearerToken(headers: Headers): string | null {
  const auth = headers.get('authorization') ?? headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Resolve a session for a request. Returns null when the caller is anonymous.
 *
 * @param headers Incoming request headers (Fetch API `Headers`).
 * @returns A `Session`, or null if no user could be resolved.
 */
export async function getSession(headers: Headers): Promise<Session | null> {
  if (supabaseConfigured()) {
    const token = readBearerToken(headers);
    if (!token) return debugFallback(headers);
    const sb = createSupabaseServerClient(token);
    if (!sb) return debugFallback(headers);
    try {
      const { data, error } = await sb.auth.getUser(token);
      if (error || !data?.user) return null;
      const user: AuthUser = { id: data.user.id, email: data.user.email ?? null };
      return { userId: user.id, user, accessToken: token, expiresAt: null };
    } catch {
      return null;
    }
  }
  return debugFallback(headers);
}

/**
 * Resolve a session or throw a typed error. Use from procedures that must run
 * authed.
 *
 * @param headers Incoming request headers.
 * @throws `AuthRequiredError` when no session can be resolved.
 */
export async function requireSession(headers: Headers): Promise<Session> {
  const session = await getSession(headers);
  if (!session) throw new AuthRequiredError();
  return session;
}

/**
 * Local-dev fallback. Reads the debug user id off the `x-debug-user-id`
 * header. Refuses to honor the header in production so a missing env never
 * silently turns into an auth bypass.
 */
function debugFallback(headers: Headers): Session | null {
  if (process.env.NODE_ENV === 'production') return null;
  const userId = headers.get(DEBUG_USER_HEADER);
  if (!userId || userId.length === 0) return null;
  const email = headers.get(DEBUG_EMAIL_HEADER);
  const user: AuthUser = { id: userId, email: email && email.length > 0 ? email : null };
  return { userId, user, accessToken: 'debug-token', expiresAt: null };
}

/** Thrown by `requireSession` when no session can be resolved. */
export class AuthRequiredError extends Error {
  constructor(message: string = 'Sign-in required.') {
    super(message);
    this.name = 'AuthRequiredError';
  }
}
