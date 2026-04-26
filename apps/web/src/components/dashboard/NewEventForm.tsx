'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcMutation } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';

interface CreateEventInput {
  name: string;
  branding?: { primaryColor?: string; accentColor?: string };
  settings?: { slideshowSpeedSeconds?: number; allowVideoUploads?: boolean };
}

interface CreateEventResult {
  id: string;
  slug: string;
  name: string;
  claimToken: string | null;
}

const DEFAULT_PRIMARY = '#E85D5D';
const DEFAULT_ACCENT = '#5FBFA6';
const DEFAULT_SLIDESHOW = 3.5;

/**
 * Authed event-creation form. Authed callers don't need a claim token (the
 * server returns null) so we route straight to the new event's detail page.
 */
export function NewEventForm(): JSX.Element {
  const router = useRouter();
  const auth = useDashboardAuth();
  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [slideshowSpeed, setSlideshowSpeed] = useState(DEFAULT_SLIDESHOW);
  const [allowVideo, setAllowVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await trpcMutation<CreateEventInput, CreateEventResult>(
        'event.create',
        {
          name: name.trim(),
          branding: { primaryColor, accentColor },
          settings: {
            slideshowSpeedSeconds: slideshowSpeed,
            allowVideoUploads: allowVideo,
          },
        },
        auth,
      );
      router.push(`/dashboard/events/${result.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 max-w-2xl">
      <Card>
        <TextField
          label="Event name"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sam and Mya's Wedding"
        />
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">Branding</h3>
        <p className="text-sm text-graphite mb-4">
          Logo upload happens after the event exists. Pick the colors here; you
          can refine them anytime from the event detail page.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorPickerRow
            label="Primary color"
            hint="Buttons, header bar, accents."
            value={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorPickerRow
            label="Secondary accent"
            hint="Highlights and secondary buttons."
            value={accentColor}
            onChange={setAccentColor}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">Settings</h3>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">
              Slideshow speed (seconds): {slideshowSpeed.toFixed(1)}
            </span>
            <input
              type="range"
              min={2}
              max={10}
              step={0.5}
              value={slideshowSpeed}
              onChange={(e) => setSlideshowSpeed(parseFloat(e.target.value))}
            />
            <span className="text-xs text-graphite">
              How long each photo stays on screen before swapping.
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={allowVideo}
              onChange={(e) => setAllowVideo(e.target.checked)}
            />
            <span className="text-sm">
              Allow video uploads (paid feature; free tier rejects video).
            </span>
          </label>
        </div>
      </Card>

      {error ? <p className="text-coral text-sm">{error}</p> : null}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || name.trim().length === 0}>
          {submitting ? 'Creating...' : 'Create event'}
        </Button>
      </div>
    </form>
  );
}

interface ColorPickerRowProps {
  label: string;
  hint: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorPickerRow({ label, hint, value, onChange }: ColorPickerRowProps): JSX.Element {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-stone bg-cream cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-lg border border-stone bg-cream px-3 py-2 text-sm font-mono"
        />
      </div>
      <p className="text-xs text-graphite mt-1">{hint}</p>
    </div>
  );
}
