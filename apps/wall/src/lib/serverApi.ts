/**
 * Server-side fetch helpers for the wall app. Talk to the web app's tRPC HTTP
 * adapter via plain fetch so we don't depend on the React Query bundle in
 * server components.
 */

interface EventDto {
  id: string;
  slug: string;
  name: string;
  settings: Record<string, unknown> | null;
  branding: Record<string, unknown> | null;
  retainUntil: string;
  tier: string;
}

interface PostDto {
  id: string;
  caption: string | null;
  createdAt: string;
  photos: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    mediaType: string;
  }>;
}

/** Resolve the web base URL. Defaults to the local web dev server. */
export function webBase(): string {
  return process.env.NEXT_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000';
}

/**
 * Fetch an event by slug from the web app's tRPC endpoint. Returns null when
 * the event does not exist.
 */
export async function getEventBySlug(slug: string): Promise<EventDto | null> {
  const url = `${webBase()}/api/trpc/event.bySlug?input=${encodeURIComponent(
    JSON.stringify({ json: { slug } }),
  )}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  try {
    const body = (await res.json()) as { result?: { data?: { json?: EventDto } } };
    return body?.result?.data?.json ?? null;
  } catch {
    return null;
  }
}

/** Fetch initial posts for an event. */
export async function getPostsForEvent(eventId: string): Promise<PostDto[]> {
  const url = `${webBase()}/api/trpc/post.list?input=${encodeURIComponent(
    JSON.stringify({ json: { eventId } }),
  )}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  try {
    const body = (await res.json()) as { result?: { data?: { json?: PostDto[] } } };
    return body?.result?.data?.json ?? [];
  } catch {
    return [];
  }
}
