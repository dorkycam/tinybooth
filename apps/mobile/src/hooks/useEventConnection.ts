/**
 * React hook around the event-connection module. Surfaces the current
 * pairing plus connect/disconnect actions; mounts a hydrate effect once.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  clearConnection,
  loadConnection,
  saveConnection,
  type EventConnection,
} from '@/lib/eventConnection';

export interface EventConnectionHook {
  connection: EventConnection | null;
  loading: boolean;
  connect(connection: EventConnection): Promise<void>;
  disconnect(): Promise<void>;
}

/** Read + manage the booth's current event pairing. */
export function useEventConnection(): EventConnectionHook {
  const [connection, setConnection] = useState<EventConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadConnection().then((c) => {
      if (cancelled) return;
      setConnection(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async (next: EventConnection): Promise<void> => {
    await saveConnection(next);
    setConnection(next);
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    await clearConnection();
    setConnection(null);
  }, []);

  return { connection, loading, connect, disconnect };
}
