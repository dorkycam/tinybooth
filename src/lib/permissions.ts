/**
 * Permission helpers for camera + photo library.
 *
 * Wraps `react-native-vision-camera`'s permission API and `expo-media-library`'s
 * permission API behind a single typed interface. The booth UX shows an
 * in-app primer screen first ("here is why we need this") and then calls into
 * these helpers to trigger the actual OS prompt. That two-step is required
 * by App Store + Play Store guidance: explain, then ask.
 */

/** A permission's resolved state. */
export type PermissionStatus = 'granted' | 'denied' | 'restricted' | 'unknown';

interface VisionCameraPermissionModule {
  Camera: {
    getCameraPermissionStatus(): 'granted' | 'denied' | 'restricted' | 'not-determined';
    requestCameraPermission(): Promise<'granted' | 'denied' | 'restricted'>;
  };
}

interface MediaLibraryPermissionModule {
  getPermissionsAsync(writeOnly: boolean): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
  requestPermissionsAsync(writeOnly: boolean): Promise<{ status: 'granted' | 'denied' | 'undetermined' }>;
}

/** Returns the current status of camera permission without prompting. */
export async function getCameraPermissionStatus(): Promise<PermissionStatus> {
  try {
    const mod = (await import('react-native-vision-camera')) as unknown as VisionCameraPermissionModule;
    return normalize(mod.Camera.getCameraPermissionStatus());
  } catch {
    return 'unknown';
  }
}

/** Triggers the OS camera-permission prompt. Returns the resolved status. */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    const mod = (await import('react-native-vision-camera')) as unknown as VisionCameraPermissionModule;
    return normalize(await mod.Camera.requestCameraPermission());
  } catch {
    return 'denied';
  }
}

/** Returns the current status of photo-library write permission without prompting. */
export async function getMediaLibraryPermissionStatus(): Promise<PermissionStatus> {
  try {
    const mod = (await import('expo-media-library')) as unknown as MediaLibraryPermissionModule;
    return normalize((await mod.getPermissionsAsync(true)).status);
  } catch {
    return 'unknown';
  }
}

/** Triggers the OS photo-library prompt for write access. */
export async function requestMediaLibraryPermission(): Promise<PermissionStatus> {
  try {
    const mod = (await import('expo-media-library')) as unknown as MediaLibraryPermissionModule;
    return normalize((await mod.requestPermissionsAsync(true)).status);
  } catch {
    return 'denied';
  }
}

function normalize(value: string): PermissionStatus {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  if (value === 'restricted') return 'restricted';
  return 'unknown';
}
