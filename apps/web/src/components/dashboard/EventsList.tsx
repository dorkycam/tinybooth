'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcQuery } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';

interface OwnedEvent {
  id: string;
  name: string;
  slug: string;
  tier: string;
  retainUntil: string;
  createdAt: string;
}

/**
 * Owner's list of events. Empty-state CTA points to the new-event flow.
 */
export function EventsList(): JSX.Element {
  const auth = useDashboardAuth();
  const [events, setEvents] = useState<OwnedEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void trpcQuery<undefined, OwnedEvent[]>('dashboard.events', undefined, auth)
      .then((rows) => {
        if (!cancelled) setEvents(rows);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [auth]);

  if (error) {
    return <p className="text-coral">Could not load events: {error}</p>;
  }
  if (!events) {
    return <p className="text-graphite">Loading...</p>;
  }
  if (events.length === 0) {
    return (
      <Card className="text-center">
        <h2 className="text-2xl font-bold mb-2">No events yet</h2>
        <p className="text-graphite mb-6">
          An event is the unit that ties booth strips and TinyWall guest uploads
          together. Create your first one to get a TV link, a guest QR code, and
          a place to manage branding.
        </p>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-paper font-semibold hover:bg-coral"
        >
          Create your first event
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id}>
          <p className="text-xs uppercase tracking-wide text-graphite">{event.tier}</p>
          <h2 className="text-xl font-bold mt-1">{event.name}</h2>
          <p className="text-sm text-graphite mt-1 break-all">{event.slug}</p>
          <p className="text-xs text-graphite mt-3">
            Retained until {new Date(event.retainUntil).toLocaleDateString()}
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href={`/dashboard/events/${event.id}`}
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-paper text-sm font-semibold hover:bg-coral"
            >
              Manage
            </Link>
            <Link
              href={`/wall/${event.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-cream border border-stone px-4 py-2 text-ink text-sm font-semibold hover:bg-stone"
            >
              Open TV link
            </Link>
          </div>
        </Card>
      ))}
      <Card className="flex flex-col items-center justify-center text-center">
        <h2 className="text-lg font-bold mb-2">Add another event</h2>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-paper font-semibold hover:bg-coral"
        >
          New event
        </Link>
      </Card>
    </div>
  );
}

