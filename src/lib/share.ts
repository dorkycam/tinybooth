/**
 * Share helper backed by `expo-sharing`. Surfaces the iOS / Android system
 * share sheet so users can send the composed strip to Messages, Mail, Photos,
 * Instagram, etc.
 */
import * as Sharing from 'expo-sharing';

/** Result of a `shareStrip` call. */
export interface ShareResult {
  shared: boolean;
  /** Reason set when `shared === false`. */
  reason?: 'unavailable' | 'failed';
}

/**
 * Open the system share sheet pointed at `uri`.
 *
 * @param uri `file://` URI to the JPEG / PNG to share.
 * @param dialogTitle Optional Android dialog title.
 */
export async function shareStrip(uri: string, dialogTitle?: string): Promise<ShareResult> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return { shared: false, reason: 'unavailable' };
  }
  try {
    await Sharing.shareAsync(uri, {
      dialogTitle: dialogTitle ?? 'Share your strip',
      mimeType: 'image/jpeg',
      UTI: 'public.jpeg',
    });
    return { shared: true };
  } catch {
    return { shared: false, reason: 'failed' };
  }
}
