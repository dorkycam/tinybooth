/**
 * Shared session + user shapes used across web, wall, and mobile.
 *
 * We deliberately mirror just the fields TinyBooth actually reads. Supabase
 * returns much richer payloads; consumers reach into the raw Supabase client
 * if they need the rest.
 */

/** Authenticated user record. Mirrors `auth.users.id` + email. */
export interface AuthUser {
  /** Supabase user id (uuid). Same as `auth.users.id`. */
  id: string;
  /** Verified email address, when present. */
  email: string | null;
}

/** Active session with the JWT plus user descriptor. */
export interface Session {
  /** Convenience pointer that matches `user.id`. */
  userId: string;
  /** Resolved user record. */
  user: AuthUser;
  /** JWT bearer token, used by tRPC + REST clients. */
  accessToken: string;
  /** ISO timestamp when the token expires (best effort). */
  expiresAt: string | null;
}
