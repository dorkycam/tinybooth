/**
 * Mobile -> tRPC strip.deliver bridge.
 *
 * Posts a delivery request for a strip via email or SMS. Tier-gated on the
 * server (returns FORBIDDEN with TIER_REQUIRED for free events).
 */

const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ??
  process.env.NEXT_PUBLIC_WEB_BASE_URL ??
  'http://localhost:3000';

export interface DeliverInput {
  stripId: string;
  channel: 'email' | 'sms';
  email?: string;
  phone?: string;
}

export interface DeliverResult {
  ok: true;
  channel: 'email' | 'sms';
}

/**
 * Call strip.deliver. Throws on non-2xx with the server-provided message.
 *
 * @param input Strip + channel + recipient.
 * @param accessToken Bearer token (optional; the procedure is public).
 * @param debugUserId Optional debug-user-id forwarded for local dev.
 */
export async function deliverStrip(
  input: DeliverInput,
  accessToken?: string,
  debugUserId?: string,
): Promise<DeliverResult> {
  const url = `${WEB_BASE}/api/trpc/strip.deliver?batch=1`;
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (accessToken) headers['authorization'] = `Bearer ${accessToken}`;
  if (debugUserId) headers['x-debug-user-id'] = debugUserId;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ '0': { json: input } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as Array<{
    result?: { data?: { json?: DeliverResult } };
    error?: { message?: string };
  }>;
  const env = body[0];
  if (!env) throw new Error('Empty response.');
  if (env.error) throw new Error(env.error.message ?? 'Server error.');
  const data = env.result?.data?.json;
  if (!data) throw new Error('Missing data on response.');
  return data;
}
