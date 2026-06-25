/**
 * Capture screen: the live booth.
 *
 * Full-screen mirrored front-camera preview. Once the camera is ready the screen
 * shows a short "Get ready!" intro (about 3s) over the live preview, then runs
 * the session automatically. For each shot: a countdown (length from Settings,
 * default 3s) with optional ticking sound and haptics, then capture (haptic plus
 * a brief white screen-flash; the OS supplies the shutter sound), then a ~1.2s
 * passive peek of the just-captured shot, then the next shot. After the last
 * shot the strip is composed via the Skia bridge and the screen routes to
 * Preview with the composed strip URI.
 *
 * A top-left cancel control lets the guest abort the session and go back. No
 * per-shot accept or reject. Settings drive the feedback toggles; the layout is
 * chosen on the previous screen and passed in as a route param.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraSurface } from '@/components/CameraSurface';
import { CaptureChrome } from '@/components/CaptureChrome';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { IconButton } from '@/components/IconButton';
import { PeekMessage } from '@/components/PeekMessage';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { SafeCropOverlay } from '@/components/SafeCropOverlay';
import { ScreenFlash } from '@/components/ScreenFlash';
import { useCaptureSession, type CaptureResult } from '@/hooks/useCaptureSession';
import { useSettings } from '@/hooks/useSettings';
import {
  DEFAULT_STRIP_LAYOUT,
  frameAspectForLayout,
  parseStripLayout,
  shotCountForLayout,
  stripLayoutLabel,
  type StripLayout,
} from '@/lib/layouts';
import {
  getCameraPermissionStatus,
  requestCameraPermission,
  type PermissionStatus,
} from '@/lib/permissions';
import { useTheme } from '@/theme/useTheme';

type PermStep = 'checking' | 'priming-camera' | 'ready';

/** Capture screen entry point. */
export default function CaptureScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme('dark');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ layout?: string }>();
  const layout: StripLayout = parseStripLayout(params.layout) ?? DEFAULT_STRIP_LAYOUT;
  const frameAspect = useMemo<number>(() => frameAspectForLayout(layout), [layout]);
  const totalFrames = useMemo<number>(() => shotCountForLayout(layout), [layout]);

  const [permStep, setPermStep] = useState<PermStep>('checking');
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('unknown');

  // Feedback preferences from the shared, persisted settings store.
  const { settings } = useSettings();

  const handleComplete = useCallback(
    (result: CaptureResult): void => {
      router.replace({
        pathname: '/preview',
        params: {
          layout: result.layout,
          uris: result.uris.join('|'),
          composedUri: result.composedUri,
          composeError: result.composeError,
        },
      });
    },
    [router],
  );

  const handleExit = useCallback((): void => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const session = useCaptureSession({
    enabled: permStep === 'ready',
    layout,
    totalFrames,
    countdownFrom: settings.countdown,
    soundOn: settings.sound,
    hapticsOn: settings.haptics,
    flashOn: settings.flash,
    onComplete: handleComplete,
    onExit: handleExit,
  });

  // Resolve camera permission on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cam = await getCameraPermissionStatus();
      if (cancelled) return;
      setCameraStatus(cam);
      setPermStep(cam === 'granted' ? 'ready' : 'priming-camera');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCameraContinue(): Promise<void> {
    const next = await requestCameraPermission();
    setCameraStatus(next);
    if (next === 'granted') setPermStep('ready');
  }

  if (permStep === 'checking') {
    return <View style={[styles.root, { backgroundColor: theme.colors.bg }]} />;
  }

  if (permStep === 'priming-camera') {
    return (
      <PermissionPrimer
        title="TinyBooth needs your camera."
        body={
          'We use the camera to take photos in the booth. Photos stay on this device. ' +
          'TinyBooth never uploads anything.'
        }
        permanentlyDenied={cameraStatus === 'denied'}
        onContinue={() => void handleCameraContinue()}
        onCancel={session.exitToHome}
      />
    );
  }

  const { state, framesCaptured, flashActive } = session;
  const digit = state.kind === 'countdown' ? state.digit : null;
  const getReadyMessage = state.kind === 'get-ready' ? 'Get ready!' : null;
  const peek = state.kind === 'reveal' ? state : null;

  let hint: string;
  let subhint: string | null = null;
  if (state.kind === 'get-ready') {
    hint = 'Get ready!';
    subhint = `${totalFrames} photos · ${stripLayoutLabel(layout)}`;
  } else if (state.kind === 'composing') {
    hint = 'Composing your strip...';
  } else {
    hint = `${framesCaptured} / ${totalFrames}`;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.preview}>
        <CameraSurface
          ref={session.cameraRef}
          flash="off"
          isActive={state.kind !== 'composing'}
        />
        <SafeCropOverlay frameAspect={frameAspect} accent={theme.colors.primary} />
        {peek ? (
          <>
            <Image
              source={{ uri: peek.uri }}
              style={styles.peek}
              resizeMode="cover"
              accessibilityLabel="Your last shot"
            />
            {peek.message ? <PeekMessage message={peek.message} /> : null}
          </>
        ) : null}
        <CountdownOverlay digit={digit} message={getReadyMessage} />
        <ScreenFlash active={flashActive} onDone={session.clearFlash} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.cancel, { top: insets.top + theme.spacing.sm, left: insets.left + theme.spacing.lg }]}
      >
        <IconButton
          icon="close"
          accessibilityLabel="Cancel and leave the booth"
          onPress={session.exitToHome}
          variant="ghost"
          glass
          size={44}
        />
      </View>

      <CaptureChrome hint={hint} subhint={subhint} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { flex: 1 },
  cancel: {
    position: 'absolute',
  },
  peek: {
    ...StyleSheet.absoluteFillObject,
  },
});
