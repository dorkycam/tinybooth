/**
 * Lightweight client-side helpers for tRPC calls from the dashboard pages.
 *
 * Phase 1 used a hand-rolled fetch wrapper to avoid pulling in the React
 * Query stack for a single anon form. The dashboard does many more calls so
 * a shared helper here cuts the boilerplate without introducing the Provider.
 *
 * Header strategy:
 *   - Production: the Authorization bearer is attached from the auth hook.
 *   - Local dev: when the auth hook surfaces a debug user id we forward it
 *     under `x-debug-user-id` so the server fallback in `@tinybooth/auth`
 *     accepts the call.
 */

export interface ApiAuth {
  accessToken?: string | null;
  debugUserId?: string | null;
  debugUserEmail?: string | null;
}

/** Build the headers consulted by every tRPC call. */
export function authHeaders(auth: ApiAuth): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (auth.accessToken) headers['authorization'] = `Bearer ${auth.accessToken}`;
  if (auth.debugUserId) headers['x-debug-user-id'] = auth.debugUserId;
  if (auth.debugUserEmail) headers['x-debug-user-email'] = auth.debugUserEmail;
  return headers;
}

/**
 * POST a tRPC mutation as JSON. Returns the typed result or throws an
 * Error with the server-provided message.
 */
export async function trpcMutation<TInput, TOutput>(
  path: string,
  input: TInput,
  auth: ApiAuth = {},
): Promise<TOutput> {
  const url = `/api/trpc/${path}?batch=1`;
  const body = { '0': { json: input } };
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(auth),
    body: JSON.stringify(body),
  });
  return parseResult<TOutput>(res);
}

/**
 * GET a tRPC query. Returns the typed result or throws.
 */
export async function trpcQuery<TInput, TOutput>(
  path: string,
  input: TInput,
  auth: ApiAuth = {},
): Promise<TOutput> {
  const params = new URLSearchParams();
  params.set('input', JSON.stringify({ json: input }));
  const url = `/api/trpc/${path}?${params.toString()}`;
  const res = await fetch(url, { method: 'GET', headers: authHeaders(auth) });
  return parseResult<TOutput>(res);
}

interface BatchEnvelope<T> {
  result?: { data?: { json?: T } };
  error?: { message?: string };
}

async function parseResult<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as BatchEnvelope<T> | Array<BatchEnvelope<T>>;
  const envelope = Array.isArray(body) ? body[0] : body;
  if (!envelope) throw new Error('Empty response.');
  if (envelope.error) {
    throw new Error(envelope.error.message ?? 'Unknown server error.');
  }
  const data = envelope.result?.data?.json;
  if (data === undefined) throw new Error('Missing data on response.');
  return data;
}
