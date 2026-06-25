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
 */
import type { JSX } from 'react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface CameraSurfaceProps {
  isActive: boolean;
  flash: 'on' | 'off';
  style?: ViewStyle;
}

/** Imperative handle exposed via `ref`. */
export interface CameraSurfaceHandle {
  /**
   * Capture a single photo with the current flash setting and return its file
   * URI. Throws if vision-camera is unavailable.
   */
  takePhoto(): Promise<string>;
}

/** Lazy-loaded vision-camera module shape. */
interface VisionCameraModule {
  Camera: React.ForwardRefExoticComponent<
    {
      device: unknown;
      isActive: boolean;
      photo?: boolean;
      style?: ViewStyle;
    } & React.RefAttributes<unknown>
  >;
  useCameraDevice(position: 'front' | 'back'): unknown;
}

interface VisionCameraInstance {
  takePhoto(opts?: { flash?: 'on' | 'off' }): Promise<{ path: string }>;
}

export const CameraSurface = forwardRef<CameraSurfaceHandle, CameraSurfaceProps>(
  function CameraSurface({ isActive, flash, style }, ref): JSX.Element {
    const [mod, setMod] = useState<VisionCameraModule | null>(null);
    const cameraRef = useRef<VisionCameraInstance | null>(null);

    useEffect(() => {
      let cancelled = false;
      void (async () => {
        try {
          const loaded = (await import('react-native-vision-camera')) as unknown as VisionCameraModule;
          if (!cancelled) setMod(loaded);
        } catch {
          if (!cancelled) setMod(null);
        }
      })();
      return () => {
        cancelled = true;
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
          const uri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
          return uri;
        },
      }),
      [flash],
    );

    if (!mod) {
      return <View style={[styles.root, style]} />;
    }

    return <CameraInner mod={mod} isActive={isActive} cameraRef={cameraRef} style={style} />;
  },
);

interface CameraInnerProps {
  mod: VisionCameraModule;
  isActive: boolean;
  cameraRef: React.MutableRefObject<VisionCameraInstance | null>;
  style?: ViewStyle;
}

function CameraInner({ mod, isActive, cameraRef, style }: CameraInnerProps): JSX.Element {
  const device = mod.useCameraDevice('front');
  if (!device) {
    return <View style={[styles.root, style]} />;
  }
  const Camera = mod.Camera;
  const composedStyle: ViewStyle = { ...styles.root, ...(style ?? {}) };
  return (
    <Camera
      ref={(instance) => {
        cameraRef.current = instance as unknown as VisionCameraInstance;
      }}
      device={device}
      isActive={isActive}
      photo
      style={composedStyle}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1216',
  },
});
