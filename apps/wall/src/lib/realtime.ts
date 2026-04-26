/**
 * Realtime helper for the wall TV display.
 *
 * Strategy:
 *   1. If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
 *      set, subscribe to Postgres CDC on the `Post` table filtered by event id.
 *   2. Otherwise, fall back to polling `post.list` every 5 seconds.
 *
 * Either way we return an unsubscribe function so the caller can wire it into
 * a React effect cleanup.
 */
import { getApi } from './api';

type AnyPost = Record<string, unknown>;

export interface RealtimeOptions {
  eventId: string;
  /** Fired whenever the upstream signals new posts. */
  onPosts: (posts: AnyPost[]) => void;
  /** Polling interval when realtime is unavailable. Defaults to 5000ms. */
  pollMs?: number;
}

/**
 * Subscribe to live post updates for a single event. Returns the unsubscribe
 * function. Caller should invoke it on unmount.
 */
export function subscribeToPosts(opts: RealtimeOptions): () => void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    return subscribeViaSupabase(url, anon, opts);
  }
  return subscribeViaPolling(opts);
}

/**
 * Supabase Realtime path. Lazy-imports the SDK so the polling fallback doesn't
 * bundle the websocket client.
 */
function subscribeViaSupabase(
  url: string,
  anon: string,
  opts: RealtimeOptions,
): () => void {
  let unsub = (): void => {
    /* noop until import resolves */
  };
  void (async () => {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(url, anon);
    const channel = sb
      .channel(`posts-${opts.eventId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Post', filter: `eventId=eq.${opts.eventId}` },
        async () => {
          const fresh = await getApi().post.list.query({ eventId: opts.eventId });
          opts.onPosts(fresh as unknown as AnyPost[]);
        },
      )
      .subscribe();
    unsub = (): void => {
      void sb.removeChannel(channel);
    };
  })();
  return () => unsub();
}

/** Polling fallback path. */
function subscribeViaPolling(opts: RealtimeOptions): () => void {
  const intervalMs = opts.pollMs ?? 5000;
  let cancelled = false;
  const tick = async (): Promise<void> => {
    if (cancelled) return;
    try {
      const posts = await getApi().post.list.query({ eventId: opts.eventId });
      if (!cancelled) opts.onPosts(posts as unknown as AnyPost[]);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[realtime] poll failed:', err);
    }
  };
  void tick();
  const handle = setInterval(() => void tick(), intervalMs);
  return () => {
    cancelled = true;
    clearInterval(handle);
  };
}
