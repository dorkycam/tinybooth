'use client';

import { useState } from 'react';
import { supabaseConfigured } from '@tinybooth/auth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';
import type { DashboardAuth } from '../../lib/useDashboardAuth';

interface SignInPanelProps {
  auth: DashboardAuth;
}

/**
 * Sign-in surface used when the dashboard has no resolved session.
 *
 * Two modes:
 *   - When Supabase is configured: Apple + Google + magic link buttons.
 *   - When envs are missing: a debug "sign in as user" form so local dev
 *     works without provisioning. Mirrors the server-side fallback in
 *     `@tinybooth/auth`.
 */
export function SignInPanel({ auth }: SignInPanelProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [debugId, setDebugId] = useState('');
  const [debugEmail, setDebugEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = supabaseConfigured();

  async function handleMagicLink(): Promise<void> {
    setStatus(null);
    setError(null);
    try {
      await auth.sendMagicLink(email);
      setStatus('Check your email for a sign-in link.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <h2 className="text-2xl font-bold mb-2">Sign in to TinyBooth</h2>
      <p className="text-graphite text-sm mb-6">
        Hosts use a free TinyBooth account to manage events, customize branding,
        and pull bulk downloads after the party.
      </p>

      {configured ? (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={() => void auth.signInWithApple().catch((e) => setError((e as Error).message))}
          >
            Continue with Apple
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => void auth.signInWithGoogle().catch((e) => setError((e as Error).message))}
          >
            Continue with Google
          </Button>
          <div className="my-4 h-px bg-stone" />
          <TextField
            label="Email magic link"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="button"
            disabled={email.trim().length === 0}
            onClick={() => void handleMagicLink()}
          >
            Send magic link
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-graphite bg-stone rounded p-3">
            Supabase is not configured for this build. Use the debug sign-in to
            test the dashboard locally; it persists a stub user id in
            localStorage and is honored by the server fallback.
          </p>
          <TextField
            label="Debug user id"
            placeholder="user-001"
            value={debugId}
            onChange={(e) => setDebugId(e.target.value)}
          />
          <TextField
            label="Debug email (optional)"
            type="email"
            placeholder="you@example.com"
            value={debugEmail}
            onChange={(e) => setDebugEmail(e.target.value)}
          />
          <Button
            type="button"
            disabled={debugId.trim().length === 0}
            onClick={() => {
              try {
                auth.signInWithDebug(debugId.trim(), debugEmail.trim() || undefined);
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            Sign in (debug)
          </Button>
        </div>
      )}

      {status ? <p className="mt-4 text-mint text-sm">{status}</p> : null}
      {error ? <p className="mt-4 text-coral text-sm">{error}</p> : null}
    </Card>
  );
}
