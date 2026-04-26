'use client';

import { useEffect, useState } from 'react';
import { useDashboardAuth } from '../../../lib/useDashboardAuth';
import { trpcMutation, trpcQuery } from '../../../lib/dashboardApi';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { TextField } from '../../ui/TextField';

interface MessagesTabProps {
  eventId: string;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
}

/**
 * Custom message library editor (paid feature). FREE tier sees a paywall card.
 */
export function MessagesTab({ eventId, tier }: MessagesTabProps): JSX.Element {
  const auth = useDashboardAuth();
  const [messages, setMessages] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void trpcQuery<{ eventId: string }, string[]>('messages.list', { eventId }, auth)
      .then((m) => {
        if (cancelled) return;
        setMessages(m);
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

  if (tier === 'FREE') {
    return (
      <Card>
        <h3 className="text-xl font-bold mb-2">Custom messages are a paid feature</h3>
        <p className="text-graphite mb-4">
          Event Pass and Event Pass Plus let you add up to 50 of your own messages
          to the random pool that flashes between booth photos.
        </p>
        <p className="text-sm text-graphite">
          Upgrade this event from the iOS or Android app to unlock.
        </p>
      </Card>
    );
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    try {
      await trpcMutation('messages.add', { eventId, text: text.trim() }, auth);
      const next = await trpcQuery<{ eventId: string }, string[]>(
        'messages.list',
        { eventId },
        auth,
      );
      setMessages(next);
      setText('');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) return <p className="text-graphite">Loading messages...</p>;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-bold mb-4">Add a message</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <TextField
            label="Message text"
            placeholder="You look great!"
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button type="submit" disabled={text.trim().length === 0}>
            Add to pool
          </Button>
          {error ? <p className="text-coral text-sm">{error}</p> : null}
        </form>
      </Card>
      <Card>
        <h3 className="text-lg font-bold mb-4">Current pool</h3>
        <ul className="text-sm flex flex-col gap-2">
          {messages.map((m, i) => (
            <li key={`${i}-${m}`} className="border-b border-stone py-2">
              {m}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
