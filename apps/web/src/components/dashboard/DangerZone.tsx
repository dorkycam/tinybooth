'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcMutation } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface DangerZoneProps {
  eventId: string;
  eventName: string;
}

/**
 * Two-step delete-event confirmation. Cascades posts/strips/photos via the
 * Prisma relation; storage cleanup happens via the cron sweep.
 */
export function DangerZone({ eventId, eventName }: DangerZoneProps): JSX.Element {
  const auth = useDashboardAuth();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirmText.trim().toLowerCase() === eventName.trim().toLowerCase();

  async function handleDelete(): Promise<void> {
    if (!matches) return;
    setSubmitting(true);
    setError(null);
    try {
      await trpcMutation('event.delete', { id: eventId }, auth);
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-xl border-coral">
      <h3 className="text-lg font-bold mb-2">Delete this event</h3>
      <p className="text-sm text-graphite mb-4">
        This drops the event row plus every guest upload and booth strip tied to
        it. Storage objects are removed by the next cleanup sweep.
      </p>
      <label className="block text-sm font-semibold mb-1">
        Type the event name to confirm
      </label>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={eventName}
        className="w-full rounded-lg border border-stone bg-cream px-4 py-3 text-ink mb-4"
      />
      <Button
        type="button"
        disabled={!matches || submitting}
        onClick={() => void handleDelete()}
      >
        {submitting ? 'Deleting...' : 'Delete event permanently'}
      </Button>
      {error ? <p className="mt-3 text-coral text-sm">{error}</p> : null}
    </Card>
  );
}
