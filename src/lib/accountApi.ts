/**
 * Mobile -> tRPC account.delete bridge.
 *
 * Mobile uses fetch directly because the React Query stack isn't loaded in
 * this Expo target. The web base URL comes from `EXPO_PUBLIC_WEB_BASE_URL`
 * (Expo) or `NEXT_PUBLIC_WEB_BASE_URL` (shared dev) so the same code path
 * works in both contexts.
 */

const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? process.env.NEXT_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000';

export interface AccountDeleteResult {
  ok: true;
  deletedEvents: number;
  deletedPhotoBlobs: number;
  storageErrors: number;
}

/**
 * Call the account.delete tRPC procedure with a bearer or debug header.
 *
 * @param accessToken Bearer token; prepended to the Authorization header.
 * @param debugUserId Optional debug-user-id forwarded so the server fallback
 *   path resolves the session in dev.
 */
export async function deleteAccount(
  accessToken: string,
  debugUserId?: string,
): Promise<AccountDeleteResult> {
  const url = `${WEB_BASE}/api/trpc/account.delete?batch=1`;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${accessToken}`,
  };
  if (debugUserId) headers['x-debug-user-id'] = debugUserId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ '0': { json: undefined } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as Array<{
    result?: { data?: { json?: AccountDeleteResult } };
    error?: { message?: string };
  }>;
  const env = body[0];
  if (!env) throw new Error('Empty response.');
  if (env.error) throw new Error(env.error.message ?? 'Server error.');
  const data = env.result?.data?.json;
  if (!data) throw new Error('Missing data on response.');
  return data;
}
