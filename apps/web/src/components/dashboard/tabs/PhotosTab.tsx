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

  if (error) return <p className="text-coral" role="alert">{error}</p>;
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-cream/60 border border-stone animate-pulse" />
        ))}
        <p className="sr-only" role="status">Loading photos.</p>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-cream/60 border border-stone p-10 text-center">
        <h3 className="text-xl font-bold mb-2">No photos yet</h3>
        <p className="text-graphite">
          Once a guest uploads to the wall or you take a strip on the booth, it shows up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.flatMap((item, itemIdx) =>
          item.photos.map((photo, photoIdx) => {
            const label =
              item.kind === 'strip'
                ? `Booth strip frame ${photoIdx + 1}`
                : `Guest upload ${itemIdx + 1}`;
            const fileName = `${item.kind}-${item.id}-${photo.id}.webp`;
            return (
              <div
                key={`${item.kind}-${item.id}-${photo.id}`}
                className="group relative aspect-square overflow-hidden rounded-lg bg-stone"
              >
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full w-full focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-lg"
                  title={label}
                  aria-label={`${label}, open full size`}
                >
                  <img src={photo.url} alt={label} className="h-full w-full object-cover" />
                </a>
                <a
                  href={photo.url}
                  download={fileName}
                  className="absolute bottom-2 right-2 rounded-full bg-ink/85 text-paper text-xs font-semibold px-3 py-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-coral transition-opacity"
                  aria-label={`Download ${label}`}
                >
                  Download
                </a>
              </div>
            );
          }),
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
