'use client';

import { useEffect, useState } from 'react';
import { PhotoTile } from './PhotoTile';
import { QROverlay } from './QROverlay';
import { subscribeToBranding, subscribeToPosts, type EventBranding } from '../../lib/realtime';

interface GridPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  mediaType: string;
}

interface GridPost {
  id: string;
  caption: string | null;
  createdAt: string;
  photos: GridPhoto[];
}

interface PhotoGridProps {
  eventId: string;
  eventName: string;
  uploadUrl: string;
  initialPosts: GridPost[];
  initialBranding?: EventBranding;
  slideShowSpeed: number;
}

const SWAP_INTERVAL_MS = 5000;

/** Compute viewport-filling grid dimensions for square base cells. */
function computeGrid(width: number, height: number): { cols: number; rows: number } {
  const cellSize = 280;
  const cols = Math.max(1, Math.round(width / cellSize));
  const rows = Math.max(1, Math.round(height / cellSize)) + 1;
  return { cols, rows };
}

/**
 * Full-viewport TV grid. Subscribes to realtime, swaps offscreen tiles every
 * 5 seconds when there are more posts than fit, and renders the QR overlay.
 */
export function PhotoGrid({
  eventId,
  eventName,
  uploadUrl,
  initialPosts,
  initialBranding,
  slideShowSpeed,
}: PhotoGridProps): JSX.Element {
  const [posts, setPosts] = useState<GridPost[]>(initialPosts);
  const [branding, setBranding] = useState<EventBranding>(initialBranding ?? {});
  const [grid, setGrid] = useState({ cols: 4, rows: 3 });
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const capacity = grid.cols * grid.rows;
  const primary = branding.primaryColor ?? '#1F2937';
  const accent = branding.accentColor ?? '#E85D5D';

  useEffect(() => {
    const update = (): void => setGrid(computeGrid(window.innerWidth, window.innerHeight));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (posts.length === 0) return;
    setVisibleIds(posts.slice(0, capacity).map((p) => p.id));
  }, [posts, capacity]);

  // Subscribe to realtime updates (or polling fallback).
  useEffect(() => {
    return subscribeToPosts({
      eventId,
      onPosts: (next) => setPosts(next as unknown as GridPost[]),
    });
  }, [eventId]);

  // Subscribe to branding updates so dashboard edits land live on the TV.
  useEffect(() => {
    return subscribeToBranding({
      eventId,
      onBranding: (next) => setBranding((prev) => ({ ...prev, ...next })),
    });
  }, [eventId]);

  // Swap offscreen tiles into the grid every 5s when there are extras.
  useEffect(() => {
    if (posts.length <= capacity) return;
    const handle = setInterval(() => {
      setVisibleIds((prev) => {
        const visible = new Set(prev);
        const queued = posts.filter((p) => !visible.has(p.id));
        if (queued.length === 0) return prev;
        const swapIdx = Math.floor(Math.random() * prev.length);
        const incoming = queued[Math.floor(Math.random() * queued.length)];
        if (!incoming) return prev;
        const next = [...prev];
        next[swapIdx] = incoming.id;
        return next;
      });
    }, SWAP_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [posts, capacity]);

  if (posts.length === 0) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-4 bg-carbon text-cream">
        <BrandedHeader eventName={eventName} primary={primary} accent={accent} logoUrl={branding.logoUrl} />
        <p className="text-fog">Scan the QR code to post the first photo!</p>
        <QROverlay uploadUrl={uploadUrl} accentColor={accent} />
      </div>
    );
  }

  const byId = new Map(posts.map((p) => [p.id, p]));
  const visible = visibleIds.map((id) => byId.get(id)).filter((p): p is GridPost => p !== undefined);

  return (
    <div className="w-screen h-screen overflow-hidden bg-carbon">
      <div
        className="grid w-full h-full gap-1 p-1"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }}
      >
        {visible.map((post) => (
          <PhotoTile
            key={post.id}
            photos={post.photos}
            caption={post.caption}
            slideShowSpeed={slideShowSpeed}
          />
        ))}
      </div>
      {/* Branded strip across the top so the host's logo + colors stay visible. */}
      <div
        className="fixed top-0 left-0 right-0 px-6 py-3 flex items-center gap-3 z-40"
        style={{ background: primary, color: '#FFFFFF' }}
      >
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="" style={{ height: 28, borderRadius: 4 }} />
        ) : null}
        <p className="text-sm font-semibold">{eventName}</p>
      </div>
      <QROverlay uploadUrl={uploadUrl} accentColor={accent} />
    </div>
  );
}

interface BrandedHeaderProps {
  eventName: string;
  primary: string;
  accent: string;
  logoUrl?: string;
}

function BrandedHeader({ eventName, primary, accent, logoUrl }: BrandedHeaderProps): JSX.Element {
  return (
    <div
      className="px-6 py-3 rounded-lg flex items-center gap-3"
      style={{ background: primary, color: '#FFFFFF', borderBottom: `3px solid ${accent}` }}
    >
      {logoUrl ? <img src={logoUrl} alt="" style={{ height: 32, borderRadius: 4 }} /> : null}
      <h1 className="text-3xl font-bold">{eventName}</h1>
    </div>
  );
}
