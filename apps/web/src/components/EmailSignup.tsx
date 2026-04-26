'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

interface EmailSignupProps {
  /** Headline shown above the input. */
  heading?: string;
  /** Sub-line shown under the input. */
  microcopy?: string;
  /** Tag the signup with the calling page so we can split later. */
  source?: string;
}

interface State {
  status: 'idle' | 'submitting' | 'sent' | 'error';
  message?: string;
}

/**
 * Lightweight email capture for the homepage and blog. POSTs to
 * /api/email-signup which writes a JSON record to apps/web/.signups in
 * dev. Real ESP wiring is out of scope for Phase 5; this captures the
 * intent and the source so we can backfill once Camrynn picks an ESP.
 */
export function EmailSignup({
  heading = 'Get the next post when it ships.',
  microcopy = 'About one email a month. Mostly setup guides. No spam.',
  source = 'unknown',
}: EmailSignupProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>({ status: 'idle' });

  /** Submit handler. */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/email-signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setState({ status: 'sent', message: 'Got it. Talk soon.' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  }

  return (
    <div className="rounded-3xl bg-cream/60 border border-stone p-6 md:p-8">
      <h3 className="text-xl font-bold text-ink">{heading}</h3>
      <p className="mt-2 text-sm text-graphite">{microcopy}</p>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <TextField
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e): void => setEmail(e.target.value)}
            required
            maxLength={254}
            aria-label="Email address"
          />
        </div>
        <Button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Saving...' : 'Sign up'}
        </Button>
      </form>
      {state.status === 'sent' ? (
        <p className="mt-3 text-sm text-mint" role="status">
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p className="mt-3 text-sm text-coral" role="alert">
          Try again, or email hello@tinybooth.com directly.
        </p>
      ) : null}
    </div>
  );
}
