'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';
import { Card } from './ui/Card';

interface CreatedEvent {
  id: string;
  slug: string;
  name: string;
}

interface CreateEventFormProps {
  /** Override the public base URL for share links (defaults to current origin). */
  baseUrl?: string;
}

/**
 * Anonymous event creation flow. POSTs to the tRPC `event.create` endpoint via
 * the JSON HTTP adapter (small enough that we skip the React Query setup for
 * Phase 1's single-form page).
 */
export function CreateEventForm({ baseUrl }: CreateEventFormProps = {}): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submit the form. Calls tRPC + (optionally) the magic link capture.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // tRPC v11 batch link expects an `input` query param wrapping superjson.
      const url = '/api/trpc/event.create?batch=1';
      const body = {
        '0': { json: { name } },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = (await res.json()) as Array<{
        result: { data: { json: CreatedEvent } };
      }>;
      const event = data[0]?.result?.data?.json;
      if (!event) throw new Error('Bad response from server.');
      setCreated(event);
      if (email && email.length > 0) {
        // Phase 1: server logs the captured email; Phase 3 ships SES magic links.
        await fetch('/api/wall/claim-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ eventId: event.id, email }),
        }).catch(() => {
          /* swallow; email capture is best-effort in Phase 1 */
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const origin = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
    const tvUrl = `${origin}/wall/${created.slug}`;
    const guestUrl = `${origin}/wall/${created.slug}/upload`;
    return (
      <Card className="text-center">
        <h2 className="text-2xl font-bold mb-2">{created.name}</h2>
        <p className="text-graphite mb-6">Your wall is live. Share these links:</p>
        <div className="flex flex-col gap-3 text-left mb-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-graphite">TV display</span>
            <a href={tvUrl} className="block break-all text-coral underline">
              {tvUrl}
            </a>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-graphite">Guest upload</span>
            <a href={guestUrl} className="block break-all text-coral underline">
              {guestUrl}
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="rounded-xl bg-paper p-4 inline-block border border-stone">
            <QRCodeSVG value={guestUrl} size={200} bgColor="#FBF7EE" fgColor="#1F2937" level="M" />
          </div>
        </div>
        <p className="mt-6 text-xs text-graphite">
          Save this QR code. Anyone with it can post to the wall for the next 7 days.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Event name"
        placeholder="Mya's Birthday"
        required
        maxLength={120}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        type="email"
        label="Your email (optional)"
        placeholder="you@example.com"
        hint="We will email you a claim link so you can manage this event later."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error ? <p className="text-coral text-sm">{error}</p> : null}
      <Button type="submit" disabled={submitting || name.trim().length === 0}>
        {submitting ? 'Creating...' : 'Create wall'}
      </Button>
    </form>
  );
}
