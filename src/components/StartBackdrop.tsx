/**
 * Live-preview backdrop for the Start screen.
 *
 * Renders the front-facing camera as a full-bleed background so the booth looks
 * already on, then lays a dim scrim over it for legible foreground content. When
 * camera permission has not been granted yet, the preview falls back to a solid
 * themed background so the Start screen still works; the capture screen's
 * permission primer handles the actual grant when the guest proceeds.
 */
import type { JSX, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraSurface } from './CameraSurface';
import { getCameraPermissionStatus } from '../lib/permissions';
import { useTheme } from '../theme/useTheme';

/** Props for {@link StartBackdrop}. */
export interface StartBackdropProps {
  /** Whether the live preview should run. Pass `false` to pause the camera. */
  isActive: boolean;
  /** Foreground content layered above the dimmed backdrop. */
  children: ReactNode;
}

/**
 * Full-screen backdrop that shows the live front camera under a dim scrim,
 * falling back to a solid themed fill when camera access is not yet granted.
 *
 * @returns The rendered backdrop with `children` layered on top.
 */
export function StartBackdrop({ isActive, children }: StartBackdropProps): JSX.Element {
  const theme = useTheme();
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const status = await getCameraPermissionStatus();
      if (!cancelled) setCameraReady(status === 'granted');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {cameraReady ? (
        <CameraSurface isActive={isActive} flash="off" style={StyleSheet.absoluteFillObject} />
      ) : null}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.scrimStrong }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
