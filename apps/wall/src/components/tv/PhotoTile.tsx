'use client';

import { useEffect, useState } from 'react';

interface TilePhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  mediaType: string;
}

interface PhotoTileProps {
  photos: TilePhoto[];
  caption: string | null;
  /** Slideshow interval in seconds for multi-photo posts. */
  slideShowSpeed: number;
}

/**
 * Tile in the TV grid. Single-photo posts render once; multi-photo posts
 * crossfade through all photos at `slideShowSpeed` seconds.
 */
export function PhotoTile({ photos, caption, slideShowSpeed }: PhotoTileProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    if (!hasMultiple) return;
    const handle = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % photos.length);
    }, slideShowSpeed * 1000);
    return () => clearInterval(handle);
  }, [hasMultiple, photos.length, slideShowSpeed]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate1">
      {photos.map((photo, index) => (
        <img
          key={photo.id}
          src={photo.url}
          alt={caption ?? 'Event photo'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: index === activeIndex ? 1 : 0 }}
        />
      ))}
      {caption ? (
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2 text-sm text-white"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
        >
          {caption}
        </div>
      ) : null}
    </div>
  );
}
