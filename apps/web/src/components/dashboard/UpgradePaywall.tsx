'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { EVENT_PASS, EVENT_PASS_PLUS, type Product } from '@tinybooth/billing';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { authHeaders, trpcQuery } from '../../lib/dashboardApi';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface DashboardEventLite {
  id: string;
  name: string;
  tier: 'FREE' | 'EVENT_PASS' | 'EVENT_PASS_PLUS';
}

interface UpgradePaywallProps {
  eventId: string;
}

/**
 * Render the per-event paywall. Two cards side by side on desktop, stacked
 * on mobile. Each card POSTs to /api/checkout and redirects to the returned
 * Stripe URL (real Stripe or the local stub). Reads `?purchase=...` from the
 * URL on mount so the post-redirect surface shows the right confirmation /
 * cancel state.
 */
export function UpgradePaywall({ eventId }: UpgradePaywallProps): JSX.Element {
  const auth = useDashboardAuth();
  const [event, setEvent] = useState<DashboardEventLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'success' | 'cancelled' | null>(null);

  useEffect(() => {
    if (auth.loading || !auth.userId) return;
    let cancelled = false;
    void trpcQuery<{ eventId: string }, DashboardEventLite>(
      'dashboard.eventById',
      { eventId },
      auth,
    )
      .then((ev) => {
        if (!cancelled) setEvent(ev);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [auth, eventId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('purchase');
    if (status === 'success' || status === 'cancelled') setPurchaseStatus(status);
  }, []);

  async function handleBuy(productId: string): Promise<void> {
    setBusy(productId);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: authHeaders(auth),
        body: JSON.stringify({ eventId, productId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Checkout failed (${res.status}): ${text.slice(0, 160)}`);
      }
      const body = (await res.json()) as { id: string; url: string };
      window.location.href = body.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  if (error) return <p className="text-coral">{error}</p>;
  if (!event) return <p className="text-graphite">Loading...</p>;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <Link href={`/dashboard/events/${event.id}`} className="text-sm text-graphite hover:text-ink">
          &larr; Back to event
        </Link>
        <h1 className="text-3xl font-bold mt-2">Upgrade {event.name}</h1>
        <p className="text-graphite mt-2 max-w-2xl">
          Custom branding, longer photo retention, more guest uploads, email and SMS delivery to
          guests. Pay once per event. No subscription.
        </p>
        {purchaseStatus === 'success' ? (
          <div className="mt-4 rounded-lg bg-mint text-paper px-4 py-3 text-sm font-semibold">
            Purchase received. Your event tier should refresh shortly.
          </div>
        ) : null}
        {purchaseStatus === 'cancelled' ? (
          <div className="mt-4 rounded-lg bg-stone text-ink px-4 py-3 text-sm">
            Checkout cancelled. No charge was made.
          </div>
        ) : null}
        {event.tier !== 'FREE' ? (
          <div className="mt-4 rounded-lg bg-cream border border-stone px-4 py-3 text-sm">
            This event is currently on{' '}
            <span className="font-semibold">
              {event.tier === 'EVENT_PASS' ? 'Event Pass' : 'Event Pass Plus'}
            </span>
            . Buying a higher tier upgrades it.
          </div>
        ) : null}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <PriceCard
          product={EVENT_PASS}
          isCurrent={event.tier === 'EVENT_PASS'}
          busy={busy === EVENT_PASS.id}
          onBuy={() => void handleBuy(EVENT_PASS.id)}
          features={[
            '150 guest uploads',
            'Custom branding (logo + colors)',
            '60-day photo retention',
            '50 email or SMS deliveries',
            'Bulk export from the dashboard',
            'Watermark removed from strips',
          ]}
        />
        <PriceCard
          product={EVENT_PASS_PLUS}
          isCurrent={event.tier === 'EVENT_PASS_PLUS'}
          highlight
          busy={busy === EVENT_PASS_PLUS.id}
          onBuy={() => void handleBuy(EVENT_PASS_PLUS.id)}
          features={[
            'Unlimited guest uploads',
            'Custom branding (logo + colors)',
            '90-day photo retention',
            '250 email or SMS deliveries',
            'Bulk export from the dashboard',
            'Watermark removed from strips',
            'Add up to 50 custom random messages',
            'Priority IG-share render',
          ]}
        />
      </div>

      <p className="mt-8 text-xs text-graphite">
        Prices are charged in USD. Web purchases use Stripe. The mobile app sells the same products
        through Apple and Google in-app purchase.
      </p>
    </div>
  );
}

interface PriceCardProps {
  product: Product;
  isCurrent: boolean;
  highlight?: boolean;
  busy: boolean;
  onBuy: () => void;
  features: string[];
}

function PriceCard({
  product,
  isCurrent,
  highlight = false,
  busy,
  onBuy,
  features,
}: PriceCardProps): JSX.Element {
  const dollars = (product.priceUsdCents.web / 100).toFixed(2);
  return (
    <Card className={highlight ? 'border-coral border-2' : ''}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{product.name}</h2>
        {highlight ? (
          <span className="text-xs uppercase tracking-wide bg-coral text-paper rounded-full px-2 py-1">
            Best value
          </span>
        ) : null}
      </div>
      <p className="text-graphite text-sm mt-2 mb-4">{product.description}</p>
      <p className="text-3xl font-bold">${dollars}</p>
      <p className="text-xs text-graphite mb-4">one-time, per event</p>
      <ul className="text-sm space-y-2 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="text-mint mt-0.5">{'\u2713'}</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={onBuy}
        disabled={busy || isCurrent}
        className="w-full"
      >
        {isCurrent ? 'Current tier' : busy ? 'Redirecting...' : `Buy ${product.name}`}
      </Button>
    </Card>
  );
}
