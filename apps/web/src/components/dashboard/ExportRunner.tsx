'use client';

import { useEffect, useRef, useState } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcMutation, trpcQuery } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface KickoffResult {
  exportId: string;
  status: string;
}

interface ExportStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'READY' | 'FAILED';
  signedUrl: string | null;
  expiresAt: string | null;
  errorMsg: string | null;
}

interface ExportRunnerProps {
  eventId: string;
}

const POLL_INTERVAL_MS = 2000;

/**
 * Bulk-export starter + poller. Pings status every 2s once an export id is
 * issued; bails out at READY or FAILED.
 */
export function ExportRunner({ eventId }: ExportRunnerProps): JSX.Element {
  const auth = useDashboardAuth();
  const [exportId, setExportId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollHandle = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollHandle.current) clearInterval(pollHandle.current);
    };
  }, []);

  async function start(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const result = await trpcMutation<{ eventId: string }, KickoffResult>(
        'dashboard.exportEvent',
        { eventId },
        auth,
      );
      setExportId(result.exportId);
      pollHandle.current = setInterval(() => {
        void poll(result.exportId);
      }, POLL_INTERVAL_MS);
      void poll(result.exportId);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function poll(id: string): Promise<void> {
    try {
      const next = await trpcQuery<{ exportId: string }, ExportStatus>(
        'dashboard.exportStatus',
        { exportId: id },
        auth,
      );
      setStatus(next);
      if ((next.status === 'READY' || next.status === 'FAILED') && pollHandle.current) {
        clearInterval(pollHandle.current);
        pollHandle.current = null;
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <Card className="max-w-xl">
      <p className="text-sm text-graphite mb-4">
        Builds a single zip with every photo for the event, uploads it back to
        storage, and emails you a download link that lasts 24 hours.
      </p>
      <Button type="button" onClick={() => void start()} disabled={submitting || exportId !== null}>
        {exportId ? 'Export in progress' : submitting ? 'Starting...' : 'Start export'}
      </Button>
      {error ? <p className="mt-4 text-coral text-sm">{error}</p> : null}
      {status ? (
        <div className="mt-6 text-sm">
          <p>Status: <span className="font-semibold">{status.status}</span></p>
          {status.status === 'READY' && status.signedUrl ? (
            <p className="mt-2">
              <a href={status.signedUrl} className="text-coral underline">
                Download the zip
              </a>
              {status.expiresAt ? (
                <span className="text-graphite ml-2">
                  Expires {new Date(status.expiresAt).toLocaleString()}
                </span>
              ) : null}
            </p>
          ) : null}
          {status.status === 'FAILED' ? (
            <p className="mt-2 text-coral">Failed: {status.errorMsg}</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
