'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { TextField } from '../ui/TextField';

interface PreviewPanelProps {
  files: File[];
  loading: boolean;
  error: string | null;
  onSubmit: (caption: string) => void;
  onBack: () => void;
}

/**
 * Preview the selected photos with an optional caption input. Object URLs are
 * created on mount and revoked on unmount.
 */
export function PreviewPanel({
  files,
  loading,
  error,
  onSubmit,
  onBack,
}: PreviewPanelProps): JSX.Element {
  const [caption, setCaption] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col gap-6 bg-paper">
      <h2 className="text-2xl font-bold text-ink">Almost there</h2>

      <div className="grid grid-cols-2 gap-2">
        {previews.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`Selected ${i + 1}`}
            className="w-full aspect-square object-cover rounded-xl"
          />
        ))}
      </div>

      <TextField
        label="Add a caption (optional)"
        maxLength={100}
        value={caption}
        placeholder="Say something nice"
        onChange={(e) => setCaption(e.target.value)}
      />

      {error ? <p className="text-coral text-sm">{error}</p> : null}

      <div className="flex flex-col gap-2 mt-auto">
        <Button onClick={() => onSubmit(caption)} disabled={loading}>
          {loading ? 'Posting...' : 'Post to wall'}
        </Button>
        <Button variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </Button>
      </div>
    </div>
  );
}
