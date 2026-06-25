/**
 * Strip delivery actions hook.
 *
 * Owns the delivery side of the preview screen: the in-flight `busy` action, the
 * save status, and the print/save/share handlers. The screen stays a thin route
 * that wires these to buttons and keeps navigation (Redo, Done) for itself.
 *
 * Each action guards on a missing strip, flips `busy` for the duration so the
 * action row can disable, and resets it in `finally`. Save additionally tracks a
 * {@link SaveState} for the status line and, when `saveFrames` is on and there is
 * more than one frame, fires the per-frame save in the background without
 * blocking the strip save result.
 */
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { saveFramesToCameraRoll, saveToCameraRoll } from '@/lib/cameraRoll';
import { printStrip } from '@/lib/print';
import { shareStrip } from '@/lib/share';

/** Save status used to drive the preview status line. */
export type SaveState = 'idle' | 'saving' | 'saved' | 'permission_denied' | 'error';
/** Which delivery action is currently in flight, if any. */
export type BusyAction = 'print' | 'save' | 'share';

/** Inputs for {@link useStripDelivery}. */
export interface UseStripDeliveryParams {
  /** URI of the composed strip to act on. May be empty before composition. */
  composedUri: string;
  /** Captured frame URIs, used for the per-frame save. */
  uris: string[];
  /** Whether to also save the individual frames alongside the strip. */
  saveFrames: boolean;
}

/** Result of {@link useStripDelivery}. */
export interface UseStripDeliveryResult {
  /** The delivery action currently in flight, or `null` when idle. */
  busy: BusyAction | null;
  /** Current save status, for the status line. */
  saveState: SaveState;
  /** Print the composed strip. */
  print: () => Promise<void>;
  /** Save the composed strip (and frames when enabled) to the camera roll. */
  save: () => Promise<void>;
  /** Share the composed strip via the system share sheet. */
  share: () => Promise<void>;
}

/**
 * Manage the print, save, and share delivery actions for a composed strip.
 *
 * @param params The composed strip URI, captured frame URIs, and save-frames flag.
 * @returns The current busy/save state and the print/save/share handlers.
 */
export function useStripDelivery({
  composedUri,
  uris,
  saveFrames,
}: UseStripDeliveryParams): UseStripDeliveryResult {
  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const print = useCallback(async (): Promise<void> => {
    if (!composedUri) {
      Alert.alert('No strip yet', 'Take some photos first.');
      return;
    }
    setBusy('print');
    try {
      const result = await printStrip(composedUri);
      if (!result.success && !result.canceled) {
        Alert.alert('Print queue may be stuck', 'Tap Print again to restart printing.');
      }
    } finally {
      setBusy(null);
    }
  }, [composedUri]);

  const save = useCallback(async (): Promise<void> => {
    if (!composedUri) return;
    setBusy('save');
    setSaveState('saving');
    try {
      const result = await saveToCameraRoll(composedUri);
      if (result.saved) {
        setSaveState('saved');
        if (saveFrames && uris.length > 1) {
          void saveFramesToCameraRoll(uris).catch(() => undefined);
        }
      } else if (result.reason === 'permission_denied') {
        setSaveState('permission_denied');
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
    } finally {
      setBusy(null);
    }
  }, [composedUri, saveFrames, uris]);

  const share = useCallback(async (): Promise<void> => {
    if (!composedUri) return;
    setBusy('share');
    try {
      await shareStrip(composedUri);
    } finally {
      setBusy(null);
    }
  }, [composedUri]);

  return useMemo<UseStripDeliveryResult>(
    () => ({ busy, saveState, print, save, share }),
    [busy, saveState, print, save, share],
  );
}
