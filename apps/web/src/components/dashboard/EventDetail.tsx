'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcQuery } from '../../lib/dashboardApi';
import { Tabs } from '../ui/Tabs';
import { OverviewTab, type EventStats } from './tabs/OverviewTab';
import { PhotosTab } from './tabs/PhotosTab';
import { BrandingTab } from './tabs/BrandingTab';
import { MessagesTab } from './tabs/MessagesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { DangerZone } from './DangerZone';

interface DashboardEvent {
  id: string;
  name: string;
  slug: string;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
  branding: { logoUrl?: string; primaryColor?: string; accentColor?: string };
  settings: { slideshowSpeedSeconds?: number; allowVideoUploads?: boolean };
  retainUntil: string;
  emailDeliveries: number;
  smsDeliveries: number;
  endsAt: string | null;
}

interface EventDetailProps {
  eventId: string;
}

/**
 * Event detail container. Loads the event row + stats, then routes the user
 * through the tabbed editor.
 */
export function EventDetail({ eventId }: EventDetailProps): JSX.Element {
  const auth = useDashboardAuth();
  const [event, setEvent] = useState<DashboardEvent | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void Promise.all([
      trpcQuery<{ eventId: string }, DashboardEvent>(
        'dashboard.eventById',
        { eventId },
        auth,
      ),
      trpcQuery<{ eventId: string }, EventStats>(
        'dashboard.eventStats',
        { eventId },
        auth,
      ),
    ])
      .then(([ev, st]) => {
        if (cancelled) return;
        setEvent(ev);
        setStats(st);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [auth, eventId]);

  if (error) return <p className="text-coral">{error}</p>;
  if (!event || !stats) return <p className="text-graphite">Loading event...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-graphite">{event.tier}</p>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-sm text-graphite break-all">/{event.slug}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/wall/${event.slug}`}
            className="inline-flex items-center justify-center rounded-full bg-cream border border-stone px-4 py-2 text-ink text-sm font-semibold hover:bg-stone"
          >
            Open TV link
          </Link>
          <Link
            href={`/dashboard/events/${event.id}/export`}
            className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-paper text-sm font-semibold hover:bg-coral"
          >
            Bulk export
          </Link>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', render: () => <OverviewTab stats={stats} /> },
          { id: 'photos', label: 'Photos', render: () => <PhotosTab eventId={event.id} /> },
          {
            id: 'branding',
            label: 'Branding',
            render: () => (
              <BrandingTab
                eventId={event.id}
                eventName={event.name}
                branding={event.branding}
                onUpdated={(next) => setEvent({ ...event, branding: { ...event.branding, ...next } })}
              />
            ),
          },
          {
            id: 'messages',
            label: 'Messages',
            render: () => <MessagesTab eventId={event.id} tier={event.tier} />,
          },
          {
            id: 'settings',
            label: 'Settings',
            render: () => (
              <SettingsTab
                eventId={event.id}
                settings={event.settings}
                onUpdated={(next) => setEvent({ ...event, settings: { ...event.settings, ...next } })}
              />
            ),
          },
          {
            id: 'danger',
            label: 'Danger zone',
            render: () => <DangerZone eventId={event.id} eventName={event.name} />,
          },
        ]}
      />
    </div>
  );
}
