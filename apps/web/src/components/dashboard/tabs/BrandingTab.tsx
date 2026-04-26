'use client';

import { useState } from 'react';
import { useDashboardAuth } from '../../../lib/useDashboardAuth';
import { trpcMutation, authHeaders } from '../../../lib/dashboardApi';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';

export interface EventBranding {
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface BrandingTabProps {
  eventId: string;
  eventName: string;
  branding: EventBranding;
  onUpdated: (next: EventBranding) => void;
}

const DEFAULT_PRIMARY = '#E85D5D';
const DEFAULT_ACCENT = '#5FBFA6';

/**
 * Branding editor with a live preview that mirrors what the wall TV header
 * and a strip footer will look like.
 */
export function BrandingTab({
  eventId,
  eventName,
  branding,
  onUpdated,
}: BrandingTabProps): JSX.Element {
  const auth = useDashboardAuth();
  const [primary, setPrimary] = useState(branding.primaryColor ?? DEFAULT_PRIMARY);
  const [accent, setAccent] = useState(branding.accentColor ?? DEFAULT_ACCENT);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(branding.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('eventId', eventId);
      form.set('logo', file);
      const headers = authHeaders(auth);
      delete headers['content-type'];
      const res = await fetch('/api/dashboard/upload-logo', {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
      const body = (await res.json()) as { url: string };
      setLogoUrl(body.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      const next: EventBranding = { primaryColor: primary, accentColor: accent };
      if (logoUrl) next.logoUrl = logoUrl;
      await trpcMutation('event.update', { id: eventId, branding: next }, auth);
      onUpdated(next);
      setStatus('Saved.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-bold mb-4">Edit branding</h3>
        <div className="flex flex-col gap-4">
          <ColorRow label="Primary color" value={primary} onChange={setPrimary} />
          <ColorRow label="Accent color" value={accent} onChange={setAccent} />
          <div>
            <label className="block text-sm font-semibold mb-1">Logo (PNG, JPG, or WebP)</label>
            <input type="file" accept="image/*" onChange={(e) => void handleLogoChange(e)} />
            {uploading ? <p className="text-xs text-graphite mt-1">Uploading...</p> : null}
            {logoUrl ? <p className="text-xs text-graphite mt-1 break-all">{logoUrl}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving...' : 'Save branding'}
            </Button>
            {status ? <span className="text-mint text-sm">{status}</span> : null}
            {error ? <span className="text-coral text-sm">{error}</span> : null}
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">Preview</h3>
        <div
          className="rounded-lg p-4 border border-stone"
          style={{ background: '#0F1216', color: '#F4EAD8' }}
        >
          <div
            className="rounded-md px-4 py-3 flex items-center gap-3"
            style={{ background: primary, color: '#FFFFFF' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="logo" style={{ height: 32, borderRadius: 6 }} />
            ) : null}
            <div>
              <p className="text-sm font-semibold">{eventName}</p>
              <p className="text-xs opacity-80">TV display header</p>
            </div>
          </div>
          <div
            className="mt-4 aspect-[4/3] rounded-md border-2 flex items-center justify-center text-sm"
            style={{ borderColor: accent, color: accent }}
          >
            Strip border + accent text
          </div>
        </div>
        <p className="text-xs text-graphite mt-3">
          Once saved, the TV wall and any new booth strips pick up the change in real time.
        </p>
      </Card>
    </div>
  );
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps): JSX.Element {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-stone bg-cream cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-32 rounded-lg border border-stone bg-cream px-3 py-2 text-sm font-mono"
        />
      </div>
    </div>
  );
}
