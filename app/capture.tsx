/**
 * Capture screen: the live booth.
 *
 * Full-screen mirrored front-camera preview. Once the camera is ready the screen
 * shows a short "Get ready!" intro (about 3s) over the live preview, then runs
 * the session automatically. For each shot: a countdown (length from Settings,
 * default 3s) with optional ticking sound and haptics, then capture (haptic, the
 * booth's own shutter snap, and either a real camera flash or a held white
 * screen-flash fill light), then a ~1.2s passive peek of the just-captured shot,
 * then the next shot. After the last
 * shot the strip is composed via the Skia bridge and the screen routes to
 * Preview with the composed strip URI.
 *
 * A top-right Close control lets the guest abort the session and go back. No
 * per-shot accept or reject. Settings drive the feedback toggles; the layout is
 * chosen on the previous screen and passed in as a route param.
 *
 * Presentation note: this screen intentionally keeps the full-bleed immersive
 * camera and does NOT adopt ScreenScaffold / useLayoutClass. WYSIWYG runs in the
 * "capture follows the preview" direction: {@link CropFrameOverlay} dims
 * everything outside a centered cell-aspect box and reports the box geometry,
 * and composition crops each photo to exactly that region (see
 * `src/lib/cropGeometry.ts`). Future responsive passes must not column-wrap the
 * live preview.
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
import { BOX_BORDER, CropFrameOverlay } from '@/components/CropFrameOverlay';
import { ScreenFlash } from '@/components/ScreenFlash';
import { useCaptureSession, type CaptureResult } from '@/hooks/useCaptureSession';
import { useSettings } from '@/hooks/useSettings';
import { counterBottomOffset, type CropRect, type PreviewCrop } from '@/lib/cropGeometry';
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

/** Default `bottom` offset for the frame-counter pill when it sits in the band. */
const COUNTER_BASE_OFFSET = 56;
/** Clearance kept between the pill and the crop box border, in pixels. */
const COUNTER_MARGIN = 12;
/** Gap tucked between the pill and the box border when anchored inside it. */
const COUNTER_TUCK_GAP = 12;
/** Extra space above the pill kept clear for the celebratory peek message. */
const PEEK_MESSAGE_GAP = 16;

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
  // Crop-box geometry measured by the overlay; composition crops to this region.
  const [crop, setCrop] = useState<PreviewCrop | null>(null);
  // Pixel box rect (container coordinates) used to anchor the frame-counter pill.
  const [boxRect, setBoxRect] = useState<CropRect | null>(null);
  // Measured height of the frame-counter pill, so its tuck math is exact.
  const [pillHeight, setPillHeight] = useState<number>(0);
  // Whether the front device has a real flash (reported by the camera surface).
  const [hasFlash, setHasFlash] = useState<boolean>(false);

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
    hasFlash,
    crop,
    onComplete: handleComplete,
    onExit: handleExit,
  });

  // Anchor the frame-counter pill to the measured crop box so it never straddles
  // the box border on height-constrained layouts (iPad landscape, iPad quad),
  // while keeping the intended in-band placement on phone portrait. The safe-area
  // inset keeps the in-band pill clear of the home indicator.
  const bottomOffset = useMemo<number>(() => {
    const inBandOffset = COUNTER_BASE_OFFSET + insets.bottom;
    if (!boxRect || pillHeight <= 0) return inBandOffset;
    return counterBottomOffset(boxRect.y, pillHeight, {
      inBandOffset,
      margin: COUNTER_MARGIN,
      boxBorder: BOX_BORDER,
      gap: COUNTER_TUCK_GAP,
    });
  }, [boxRect, pillHeight, insets.bottom]);

  // Reserve room above the pill so the celebratory peek message never collides.
  const peekClearance = bottomOffset + pillHeight + PEEK_MESSAGE_GAP;

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
          isActive={state.kind !== 'composing'}
          onFlashAvailabilityChange={setHasFlash}
        />
        {/* The peek renders full-bleed under the overlay so it aligns with the
            live preview and the box keeps marking the kept region. */}
        {peek ? (
          <Image
            source={{ uri: peek.uri }}
            style={styles.peek}
            resizeMode="cover"
            accessibilityLabel="Your last shot"
          />
        ) : null}
        <CropFrameOverlay
          frameAspect={frameAspect}
          accent={theme.colors.primary}
          onCropChange={setCrop}
          onBoxRectChange={setBoxRect}
        />
        {peek?.message ? (
          <PeekMessage message={peek.message} bottomClearance={peekClearance} />
        ) : null}
        <CountdownOverlay digit={digit} message={getReadyMessage} />
        <ScreenFlash active={flashActive} onDone={session.clearFlash} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.closeChrome, { top: insets.top + theme.spacing.sm, right: insets.right + theme.spacing.lg }]}
      >
        <IconButton
          icon="close"
          accessibilityLabel="Close and leave the booth"
          onPress={session.exitToHome}
          variant="ghost"
          glass
          size={44}
          scheme="dark"
        />
      </View>

      <CaptureChrome
        hint={hint}
        subhint={subhint}
        bottomOffset={bottomOffset}
        onHeightChange={setPillHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { flex: 1 },
  closeChrome: {
    position: 'absolute',
  },
  peek: {
    ...StyleSheet.absoluteFillObject,
  },
});
