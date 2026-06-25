/**
 * Save composed strips to the system camera roll via `expo-media-library`.
 */
import * as MediaLibrary from 'expo-media-library';

/** Result of a `saveToCameraRoll` call. */
export interface SaveResult {
  /** True when the asset was created. */
  saved: boolean;
  /** Identifier returned by MediaLibrary when saved. */
  assetId?: string;
  /** Reason for failure when saved is false. */
  reason?: 'permission_denied' | 'unknown_error';
}

/**
 * Save the strip at `uri` to the device's photo library. Requests permission
 * if not already granted.
 *
 * @param uri `file://` URI to a JPEG or PNG.
 */
export async function saveToCameraRoll(uri: string): Promise<SaveResult> {
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    return { saved: false, reason: 'permission_denied' };
  }
  try {
    const asset = await MediaLibrary.createAssetAsync(uri);
    return { saved: true, assetId: asset.id };
  } catch {
    return { saved: false, reason: 'unknown_error' };
  }
}

/** Result of a multi-frame save. */
export interface SaveManyResult {
  /** Number of frames successfully written. */
  saved: number;
  /** Number of frames attempted. */
  total: number;
  /** Reason if no frames could be saved. */
  reason?: 'permission_denied' | 'unknown_error';
}

/**
 * Save each individual capture frame as its own camera-roll asset. Used by the
 * preview screen "Save frames" action so users can pull a single shot out of a
 * strip without cropping by hand. Permissions are requested once for the batch.
 *
 * @param uris One `file://` URI per frame.
 */
export async function saveFramesToCameraRoll(uris: readonly string[]): Promise<SaveManyResult> {
  if (uris.length === 0) return { saved: 0, total: 0 };
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) {
    return { saved: 0, total: uris.length, reason: 'permission_denied' };
  }
  let saved = 0;
  for (const uri of uris) {
    try {
      await MediaLibrary.createAssetAsync(uri);
      saved += 1;
    } catch {
      // Continue on per-frame errors so one bad frame does not abort the batch.
    }
  }
  return saved === 0
    ? { saved: 0, total: uris.length, reason: 'unknown_error' }
    : { saved, total: uris.length };
}
