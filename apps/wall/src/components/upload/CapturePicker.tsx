'use client';

import { useRef } from 'react';
import { Button } from '../ui/Button';

interface CapturePickerProps {
  onFilesPicked: (files: File[]) => void;
  /** Hint the OS toward the camera capture sheet on mobile. */
  preferCamera?: boolean;
}

/**
 * Capture / library picker. Two buttons mapped to two file inputs: one with
 * `capture="environment"` (camera), one without (gallery).
 */
export function CapturePicker({ onFilesPicked, preferCamera = false }: CapturePickerProps): JSX.Element {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handle = (ref: React.RefObject<HTMLInputElement>) => (): void => {
    ref.current?.click();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const list = e.target.files;
    if (!list) return;
    const files: File[] = [];
    for (let i = 0; i < list.length; i += 1) {
      const f = list.item(i);
      if (f) files.push(f);
    }
    if (files.length > 0) onFilesPicked(files);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-paper">
      <h2 className="text-2xl font-bold text-ink">Add a photo</h2>
      <p className="text-graphite text-sm">Up to 10 files per post.</p>
      <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
        <Button onClick={handle(cameraRef)}>
          {preferCamera ? 'Open camera' : 'Take a photo'}
        </Button>
        <Button variant="secondary" onClick={handle(galleryRef)}>
          Choose from library
        </Button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={onChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onChange}
      />
    </div>
  );
}
