/**
 * Wraps `react-native-vision-camera` into a single typed surface.
 *
 * Two responsibilities:
 *   1. Render a live preview using the front-facing camera.
 *   2. Expose `takePhoto()` to the parent via an imperative ref so the capture
 *      loop can fire shutter-by-shutter without re-rendering the camera.
 *
 * If the native module is missing (vitest, web preview), we fall back to an
 * empty dark view so screen layouts compose without crashing.
 *
 * The public props are derived from the real `CameraProps` so consumers keep the
 * underlying surface (`isActive`, `style`, `testID`) and stay in sync with the
 * library. We only narrow `flash` to the on/off subset the booth uses.
 */
import type { JSX } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  Camera as VisionCamera,
  CameraDevice,
  CameraProps,
  TakePhotoOptions,
} from 'react-native-vision-camera';
import { useTheme } from '@/theme/useTheme';

/** Public props, derived from the real camera so the wrapped surface stays intact. */
interface CameraSurfaceProps extends Pick<CameraProps, 'isActive' | 'style' | 'testID'> {
  /** Flash mode applied to each `takePhoto()` call. */
  flash: Extract<NonNullable<TakePhotoOptions['flash']>, 'on' | 'off'>;
}

/** Imperative handle exposed via `ref`. */
export interface CameraSurfaceHandle {
  /**
   * Capture a single photo with the current flash setting and return its file
   * URI. Throws if vision-camera is unavailable.
   */
  takePhoto(): Promise<string>;
}

/** Full module shape, derived from the real package so wrapper types stay in sync. */
type VisionCameraModule = typeof import('react-native-vision-camera');

/**
 * Live front-camera preview with an imperative `takePhoto()` handle.
 *
 * @param props Whether the preview is active, the flash mode, and optional
 *   `style`/`testID` passthrough.
 * @param ref Imperative handle used by the capture loop to fire the shutter.
 */
export const CameraSurface = forwardRef<CameraSurfaceHandle, CameraSurfaceProps>(
  function CameraSurface({ isActive, flash, style, testID }, ref): JSX.Element {
    const theme = useTheme('dark');
    const [mod, setMod] = useState<VisionCameraModule | null>(null);
    const cameraRef = useRef<VisionCamera | null>(null);

    useEffect(() => {
      let ignore = false;
      void (async () => {
        try {
          const loaded = await import('react-native-vision-camera');
          if (!ignore) setMod(loaded);
        } catch {
          if (!ignore) setMod(null);
        }
      })();
      return () => {
        ignore = true;
      };
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        async takePhoto(): Promise<string> {
          const cam = cameraRef.current;
          if (!cam) {
            throw new Error('Camera is not ready.');
          }
          const photo = await cam.takePhoto({ flash });
          return photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
        },
      }),
      [flash],
    );

    if (!mod) {
      return (
        <View testID={testID} style={[styles.root, { backgroundColor: theme.colors.bg }, style]} />
      );
    }

    return (
      <CameraInner mod={mod} isActive={isActive} cameraRef={cameraRef} style={style} testID={testID} />
    );
  },
);

interface CameraInnerProps {
  mod: VisionCameraModule;
  isActive: boolean;
  cameraRef: React.MutableRefObject<VisionCamera | null>;
  style?: CameraProps['style'];
  testID?: CameraProps['testID'];
}

/**
 * Resolves the front device and renders the live camera, falling back to a dark
 * view while the device is unavailable. Kept separate so the device hook only
 * runs once the native module has loaded.
 *
 * @param props The loaded module, active flag, shutter ref, and passthrough props.
 */
function CameraInner({ mod, isActive, cameraRef, style, testID }: CameraInnerProps): JSX.Element {
  const theme = useTheme('dark');
  const device: CameraDevice | undefined = mod.useCameraDevice('front');
  if (!device) {
    return (
      <View testID={testID} style={[styles.root, { backgroundColor: theme.colors.bg }, style]} />
    );
  }
  const Camera = mod.Camera;
  return (
    <Camera
      ref={(instance) => {
        cameraRef.current = instance;
      }}
      device={device}
      isActive={isActive}
      photo
      style={[styles.root, style]}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
