'use client';

import { Button } from '../ui/Button';

interface WelcomeBranding {
  logoUrl?: string;
  primaryColor?: string;
}

interface WelcomeScreenProps {
  eventName: string;
  onConfirm: () => void;
  branding?: WelcomeBranding;
}

/** First-visit welcome shown to guests once per device (cookie-gated). */
export function WelcomeScreen({
  eventName,
  onConfirm,
  branding,
}: WelcomeScreenProps): JSX.Element {
  const primary = branding?.primaryColor;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-paper">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt="" style={{ height: 64, marginBottom: 24, borderRadius: 8 }} />
      ) : null}
      <h1 className="text-4xl font-bold text-ink">{eventName}</h1>
      <p className="mt-4 text-graphite max-w-sm">
        Welcome! Take or upload a few photos and they will appear on the TV in seconds.
      </p>
      <div className="mt-8">
        <Button
          onClick={onConfirm}
          style={primary ? { background: primary, color: '#FFFFFF' } : undefined}
        >
          Let me in
        </Button>
      </div>
    </div>
  );
}
