'use client';

import { useCallback, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type UploadState = 'WELCOME' | 'CAPTURE' | 'PREVIEW' | 'UPLOADING' | 'SUCCESS';

interface UseUploadFlowArgs {
  eventId: string;
  eventSlug: string;
  webApiBase: string;
  /** Maximum files per submission (server enforces 10; this is the soft cap). */
  maxFiles?: number;
}

interface UseUploadFlowResult {
  state: UploadState;
  files: File[];
  error: string | null;
  setFiles: (files: File[]) => void;
  confirmWelcome: () => void;
  back: () => void;
  submit: (caption: string) => Promise<void>;
  reset: () => void;
}

/**
 * Guest upload state machine. Mirrors the original PostFlow but pulls the
 * Apollo dependency out and centralizes side-effects in one hook so the page
 * file stays dumb.
 */
export function useUploadFlow(args: UseUploadFlowArgs): UseUploadFlowResult {
  const { eventId, eventSlug, webApiBase, maxFiles = 10 } = args;
  const [hasVisited, setHasVisited] = useLocalStorage(`visited-${eventSlug}`, false);
  const [state, setState] = useState<UploadState>(hasVisited ? 'CAPTURE' : 'WELCOME');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const confirmWelcome = useCallback((): void => {
    setHasVisited(true);
    setState('CAPTURE');
  }, [setHasVisited]);

  const back = useCallback((): void => {
    setError(null);
    setFiles([]);
    setState('CAPTURE');
  }, []);

  const reset = useCallback((): void => {
    setError(null);
    setFiles([]);
    setState('CAPTURE');
  }, []);

  const setFilesClamped = useCallback(
    (next: File[]): void => {
      const trimmed = next.slice(0, maxFiles);
      setFiles(trimmed);
      if (trimmed.length > 0) setState('PREVIEW');
    },
    [maxFiles],
  );

  const submit = useCallback(
    async (caption: string): Promise<void> => {
      if (files.length === 0) return;
      setState('UPLOADING');
      setError(null);
      try {
        const form = new FormData();
        form.append('eventSlug', eventSlug);
        for (const file of files) form.append('photos', file);
        const uploadRes = await fetch(`${webApiBase}/api/upload`, {
          method: 'POST',
          body: form,
        });
        if (!uploadRes.ok) {
          const body = (await uploadRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Upload failed (${uploadRes.status})`);
        }
        const uploaded = (await uploadRes.json()) as {
          photos: Array<{
            url: string;
            storageKey: string;
            mediaType: 'image';
            width: number;
            height: number;
          }>;
        };

        // Create the post via tRPC's HTTP batch endpoint.
        const url = `${webApiBase}/api/trpc/post.create?batch=1`;
        const body = {
          '0': {
            json: {
              eventId,
              caption: caption.length > 0 ? caption : undefined,
              photos: uploaded.photos,
            },
          },
        };
        const postRes = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!postRes.ok) {
          throw new Error(`Failed to publish (${postRes.status})`);
        }
        setFiles([]);
        setState('SUCCESS');
      } catch (err) {
        setError((err as Error).message);
        setState('PREVIEW');
      }
    },
    [files, eventId, eventSlug, webApiBase],
  );

  return {
    state,
    files,
    error,
    setFiles: setFilesClamped,
    confirmWelcome,
    back,
    submit,
    reset,
  };
}
