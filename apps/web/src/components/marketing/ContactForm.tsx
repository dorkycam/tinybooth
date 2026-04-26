'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';

interface SubmitState {
  status: 'idle' | 'submitting' | 'sent' | 'error';
  message?: string;
}

/**
 * Contact / feedback form. POSTs to /api/contact (which logs to disk in
 * dev and sends via SES when configured). Client-only for the
 * controlled-state behavior; the form fields render server-side first via
 * SSR so there is no layout shift.
 */
export function ContactForm(): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  /** Form submit handler. */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setState({ status: 'submitting' });
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setState({ status: 'sent', message: 'Thanks. We will get back to you in 24 hours.' });
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Your name"
        placeholder="Camrynn"
        value={name}
        onChange={(e): void => setName(e.target.value)}
        required
        maxLength={120}
      />
      <TextField
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e): void => setEmail(e.target.value)}
        required
        maxLength={254}
      />
      <label className="block text-sm">
        <span className="font-semibold text-ink">Message</span>
        <textarea
          className="mt-2 w-full rounded-lg border border-stone bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-coral"
          rows={6}
          required
          maxLength={2000}
          value={message}
          onChange={(e): void => setMessage(e.target.value)}
          placeholder="Question, bug report, story from your wedding..."
        />
      </label>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? 'Sending...' : 'Send'}
        </Button>
        {state.status === 'sent' ? (
          <p className="text-sm text-mint" role="status">
            {state.message}
          </p>
        ) : null}
        {state.status === 'error' ? (
          <p className="text-sm text-coral" role="alert">
            That didn&apos;t go through. Try again or email hello@tinybooth.com.
          </p>
        ) : null}
      </div>
    </form>
  );
}
