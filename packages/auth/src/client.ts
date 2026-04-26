/**
 * Supabase browser + server client factories.
 *
 * Uses `@supabase/supabase-js` directly (rather than `@supabase/ssr`) to keep
 * the dependency surface tight. The "ssr" flavor mainly wraps cookie storage
 * around the same client; we hand-wire that in `server.ts` so dev fallbacks
 * work without bundling Next.js types into this package.
 *
 * All factories require `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
 * to do real work. When envs are missing, the factories return `null` so
 * callers can fall back to the debug-header path (see `server.ts`).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Resolve required envs. Returns null when either is missing. */
function readEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.length === 0 || anonKey.length === 0) return null;
  return { url, anonKey };
}

/**
 * Build a Supabase client for use in browser code.
 *
 * @returns A configured client, or `null` when envs are missing (the calling
 *   app should fall back to the dev-only debug-header flow).
 */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const env = readEnv();
  if (!env) return null;
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

/**
 * Build a Supabase client for server-side use (route handlers, RSC, scripts).
 *
 * The caller passes in the request's Authorization bearer header so server
 * calls run with the user's JWT (RLS-aware).
 *
 * @param accessToken Optional bearer token from the request.
 * @returns A configured client, or `null` when envs are missing.
 */
export function createSupabaseServerClient(
  accessToken?: string | null,
): SupabaseClient | null {
  const env = readEnv();
  if (!env) return null;
  const headers: Record<string, string> = {};
  if (accessToken && accessToken.length > 0) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers },
  });
}

/** True when the necessary env vars are set. Useful for feature gating. */
export function supabaseConfigured(): boolean {
  return readEnv() !== null;
}
