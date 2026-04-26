'use client';

import { useEffect, useState } from 'react';
import { useDashboardAuth } from '../../../lib/useDashboardAuth';
import { trpcQuery } from '../../../lib/dashboardApi';

interface FeedPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
}

interface FeedItem {
  kind: 'post' | 'strip';
  id: string;
  createdAt: string;
  photos: FeedPhoto[];
}

interface FeedPage {
  items: FeedItem[];
  nextCursor: string | null;
}

interface PhotosTabProps {
  eventId: string;
}

/** Combined posts + strips photo grid for the event detail page. */
export function PhotosTab({ eventId }: PhotosTabProps): JSX.Element {
  const auth = useDashboardAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void trpcQuery<{ eventId: string; cursor?: string }, FeedPage>(
      'dashboard.eventPhotos',
      { eventId },
      auth,
    )
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth, eventId]);

  async function loadMore(): Promise<void> {
    if (!cursor) return;
    try {
      const next = await trpcQuery<{ eventId: string; cursor?: string }, FeedPage>(
        'dashboard.eventPhotos',
        { eventId, cursor },
        auth,
      );
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (error) return <p className="text-coral">{error}</p>;
  if (loading) return <p className="text-graphite">Loading photos...</p>;
  if (items.length === 0) {
    return <p className="text-graphite">No photos yet. Once a guest uploads or you take a strip, it shows up here.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.flatMap((item) =>
          item.photos.map((photo) => (
            <a
              key={`${item.kind}-${item.id}-${photo.id}`}
              href={photo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-lg bg-stone"
              title={item.kind === 'strip' ? 'Booth strip' : 'Guest upload'}
            >
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
            </a>
          )),
        )}
      </div>
      {cursor ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-paper text-sm font-semibold hover:bg-coral"
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
