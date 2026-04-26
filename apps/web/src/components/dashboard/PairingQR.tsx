'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { trpcMutation } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PairingQRProps {
  eventId: string;
}

interface PairingResult {
  code: string;
  url: string;
  expiresAt: string;
}

/**
 * Host-only QR for pairing the iPad booth with this event. The mobile app's
 * connect-to-event tab scans the QR and POSTs the eventId + code back to
 * pair, then uploads strips to this event.
 */
export function PairingQR({ eventId }: PairingQRProps): JSX.Element {
  const auth = useDashboardAuth();
  const [pair, setPair] = useState<PairingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const result = await trpcMutation<{ eventId: string }, PairingResult>(
        'dashboard.pairingCode',
        { eventId },
        auth,
      );
      setPair(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-lg font-bold mb-2">Pair with iPad</h3>
      <p className="text-sm text-graphite mb-4">
        Tap to issue a 10-minute pairing QR. Open the TinyBooth app on the iPad
        running the booth, go to the event tab, tap "Scan host QR" and point at
        this code.
      </p>
      {pair ? (
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl bg-paper p-4 inline-block border border-stone">
            <QRCodeSVG value={pair.url} size={180} bgColor="#FBF7EE" fgColor="#1F2937" level="M" />
          </div>
          <p className="text-xs text-graphite text-center break-all">
            Expires {new Date(pair.expiresAt).toLocaleTimeString()}
          </p>
          <Button variant="secondary" type="button" onClick={() => void generate()} disabled={loading}>
            Refresh QR
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={() => void generate()} disabled={loading}>
          {loading ? 'Generating...' : 'Generate pairing QR'}
        </Button>
      )}
      {error ? <p className="mt-3 text-coral text-sm">{error}</p> : null}
    </Card>
  );
}
