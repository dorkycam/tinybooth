/**
 * Wraps `react-native-vision-camera` into a single typed surface.
 *
 * Three responsibilities:
 *   1. Render a live preview using the front-facing camera.
 *   2. Expose `takePhoto(args)` to the parent via an imperative ref so the
 *      capture loop can fire shutter-by-shutter, choosing the flash per shot and
 *      always suppressing the native shutter sound (the booth plays its own snap).
 *   3. Report whether the resolved front device has a real flash so the parent
 *      can pick between real flash and the on-screen fill light.
 *
 * If the native module is missing (vitest, web preview), we fall back to an
 * empty dark view so screen layouts compose without crashing.
 *
 * The public props are derived from the real `CameraProps` so consumers keep the
 * underlying surface (`isActive`, `style`, `testID`) and stay in sync with the
 * library.
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

/** The on/off flash subset the booth uses. */
type BoothFlash = Extract<NonNullable<TakePhotoOptions['flash']>, 'on' | 'off'>;

/** Public props, derived from the real camera so the wrapped surface stays intact. */
interface CameraSurfaceProps extends Pick<CameraProps, 'isActive' | 'style' | 'testID'> {
  /** Reports whether the resolved front device has a real (Retina) flash. */
  onFlashAvailabilityChange?: (hasFlash: boolean) => void;
}

/** Arguments for a single {@link CameraSurfaceHandle.takePhoto} call. */
export interface TakePhotoArgs {
  /** Flash mode for this shot. Only `'on'` when the device has a real flash. */
  flash: BoothFlash;
}

/** Imperative handle exposed via `ref`. */
export interface CameraSurfaceHandle {
  /**
   * Capture a single photo with the given flash mode and return its file URI.
   * The native shutter sound is suppressed so it never doubles the booth's own
   * snap. Throws if vision-camera is unavailable.
   */
  takePhoto(args: TakePhotoArgs): Promise<string>;
}

/** Full module shape, derived from the real package so wrapper types stay in sync. */
type VisionCameraModule = typeof import('react-native-vision-camera');

/**
 * Live front-camera preview with an imperative `takePhoto()` handle.
 *
 * @param props Whether the preview is active, the flash-availability callback,
 *   and optional `style`/`testID` passthrough.
 * @param ref Imperative handle used by the capture loop to fire the shutter.
 */
export const CameraSurface = forwardRef<CameraSurfaceHandle, CameraSurfaceProps>(
  function CameraSurface(
    { isActive, onFlashAvailabilityChange, style, testID },
    ref,
  ): JSX.Element {
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
        async takePhoto({ flash }: TakePhotoArgs): Promise<string> {
          const cam = cameraRef.current;
          if (!cam) {
            throw new Error('Camera is not ready.');
          }
          const photo = await cam.takePhoto({ flash, enableShutterSound: false });
          return photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
        },
      }),
      [],
    );

    if (!mod) {
      return (
        <View testID={testID} style={[styles.root, { backgroundColor: theme.colors.bg }, style]} />
      );
    }

    return (
      <CameraInner
        mod={mod}
        isActive={isActive}
        cameraRef={cameraRef}
        onFlashAvailabilityChange={onFlashAvailabilityChange}
        style={style}
        testID={testID}
      />
    );
  },
);

interface CameraInnerProps {
  mod: VisionCameraModule;
  isActive: boolean;
  cameraRef: React.MutableRefObject<VisionCamera | null>;
  onFlashAvailabilityChange?: (hasFlash: boolean) => void;
  style?: CameraProps['style'];
  testID?: CameraProps['testID'];
}

/**
 * Resolves the front device and renders the live camera, falling back to a dark
 * view while the device is unavailable. Kept separate so the device hook only
 * runs once the native module has loaded.
 *
 * @param props The loaded module, active flag, shutter ref, flash-availability
 *   callback, and passthrough props.
 */
function CameraInner({
  mod,
  isActive,
  cameraRef,
  onFlashAvailabilityChange,
  style,
  testID,
}: CameraInnerProps): JSX.Element {
  const theme = useTheme('dark');
  const device: CameraDevice | undefined = mod.useCameraDevice('front');
  const hasFlash = device?.hasFlash ?? false;

  // Report flash availability up so the capture loop can pick real flash vs the
  // on-screen fill light. Runs before the early return to keep hook order stable.
  useEffect(() => {
    onFlashAvailabilityChange?.(hasFlash);
  }, [hasFlash, onFlashAvailabilityChange]);

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
