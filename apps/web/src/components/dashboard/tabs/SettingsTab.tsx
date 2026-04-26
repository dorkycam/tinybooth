'use client';

import { useState } from 'react';
import { useDashboardAuth } from '../../../lib/useDashboardAuth';
import { trpcMutation } from '../../../lib/dashboardApi';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export interface EventSettings {
  slideshowSpeedSeconds?: number;
  allowVideoUploads?: boolean;
}

interface SettingsTabProps {
  eventId: string;
  settings: EventSettings;
  onUpdated: (next: EventSettings) => void;
}

/**
 * Slideshow speed + video toggle editor.
 */
export function SettingsTab({ eventId, settings, onUpdated }: SettingsTabProps): JSX.Element {
  const auth = useDashboardAuth();
  const [speed, setSpeed] = useState<number>(settings.slideshowSpeedSeconds ?? 3.5);
  const [allowVideo, setAllowVideo] = useState<boolean>(Boolean(settings.allowVideoUploads));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const next: EventSettings = {
        slideshowSpeedSeconds: speed,
        allowVideoUploads: allowVideo,
      };
      await trpcMutation('event.update', { id: eventId, settings: next }, auth);
      onUpdated(next);
      setStatus('Saved.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <h3 className="text-lg font-bold mb-4">Event settings</h3>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Slideshow speed (seconds): {speed.toFixed(1)}</span>
          <input
            type="range"
            min={2}
            max={10}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allowVideo}
            onChange={(e) => setAllowVideo(e.target.checked)}
          />
          <span className="text-sm">Allow video uploads (paid only)</span>
        </label>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
          {status ? <span className="text-mint text-sm">{status}</span> : null}
          {error ? <span className="text-coral text-sm">{error}</span> : null}
        </div>
      </div>
    </Card>
  );
}
