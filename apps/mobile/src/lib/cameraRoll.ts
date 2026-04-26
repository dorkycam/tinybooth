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
