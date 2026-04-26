/**
 * Vanilla tRPC client for the wall app. Communicates with the web app's tRPC
 * endpoint mounted at `/api/trpc`. Uses the WEB_API_BASE_URL env var when set,
 * otherwise falls back to the same-origin host (useful for local dev where
 * both apps run side-by-side via a reverse proxy or shared port).
 */
import { createVanillaClient } from '@tinybooth/api-client';
// AppRouter is exported by the web app's server tree. We type-import it so the
// wall package never bundles the web server code.
import type { AppRouter } from '../../../web/src/server/api/root';

/**
 * Resolve the tRPC base URL. Server-side defaults to the env var (Vercel sets
 * `NEXT_PUBLIC_WEB_BASE_URL` for cross-app calls); browser-side falls back to
 * the current origin so previews work without env config.
 */
function resolveBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WEB_BASE_URL;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

let cached: ReturnType<typeof createVanillaClient<AppRouter>> | undefined;

/** Build (or reuse) the tRPC client. */
export function getApi(): ReturnType<typeof createVanillaClient<AppRouter>> {
  if (cached) return cached;
  cached = createVanillaClient<AppRouter>(resolveBase());
  return cached;
}
