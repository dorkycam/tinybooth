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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraSurface, type CameraSurfaceHandle } from '@/components/CameraSurface';
import { CaptureChrome } from '@/components/CaptureChrome';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { IconButton } from '@/components/IconButton';
import { PeekMessage } from '@/components/PeekMessage';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { SafeCropOverlay } from '@/components/SafeCropOverlay';
import { ScreenFlash } from '@/components/ScreenFlash';
import { useSettings } from '@/hooks/useSettings';
import { captureHaptic, tickHaptic } from '@/lib/haptics';
import { getRandomMessage } from '@/lib/messages';
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
import { playCountdownTick, preloadBoothSounds, releaseBoothSounds } from '@/lib/sounds';
import { useTheme } from '@/theme/useTheme';
import type { SkiaBridge } from '@/lib/skiaBridge';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Ms to leave the just-captured peek visible before the next countdown. */
const PEEK_HOLD_MS = 1200;
/** Ms to show the "Get ready!" intro before the first countdown begins. */
const GET_READY_MS = 3000;

type Phase = 'get-ready' | 'countdown' | 'reveal' | 'composing';
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
  const countdownFrom = settings.countdown;
  const soundOn = settings.sound;
  const hapticsOn = settings.haptics;
  const flashOn = settings.flash;

  const [phase, setPhase] = useState<Phase>('get-ready');
  const [digit, setDigit] = useState<number | null>(null);
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const [peekUri, setPeekUri] = useState<string | null>(null);
  const [peekMessage, setPeekMessage] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  const captured = useRef<string[]>([]);
  const cameraRef = useRef<CameraSurfaceHandle | null>(null);

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

  // Preload sounds once the camera is ready.
  useEffect(() => {
    if (permStep !== 'ready') return;
    void preloadBoothSounds();
    return () => {
      releaseBoothSounds();
    };
  }, [permStep]);

  // Get ready: hold a friendly intro over the live preview, then start the
  // first countdown. Only runs once the camera is ready so it never races the
  // permission primer.
  useEffect(() => {
    if (permStep !== 'ready' || phase !== 'get-ready') return undefined;
    captured.current = [];
    setFramesCaptured(0);
    setPeekUri(null);
    setPeekMessage(null);
    const timer = setTimeout(() => {
      setPhase('countdown');
    }, GET_READY_MS);
    return () => clearTimeout(timer);
  }, [permStep, phase]);

  // Drive the countdown for the current shot.
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    let current = countdownFrom;
    setDigit(current);
    fireTick(soundOn, hapticsOn);
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setDigit(null);
        void fireShutter();
        return;
      }
      setDigit(current);
      fireTick(soundOn, hapticsOn);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase, countdownFrom, soundOn, hapticsOn]);

  // Peek: hold the just-captured shot, then loop into the next countdown.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const timer = setTimeout(() => {
      setPeekUri(null);
      setPeekMessage(null);
      setPhase('countdown');
    }, PEEK_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // After the last shot, compose the strip and route to Preview.
  useEffect(() => {
    if (phase !== 'composing') return;
    let cancelled = false;
    const frames = [...captured.current];
    void (async () => {
      const compose = (globalThis as { __TINYBOOTH_SKIA_RENDER__?: SkiaBridge })
        .__TINYBOOTH_SKIA_RENDER__;
      let composedUri = '';
      let composeError = '';
      try {
        if (!compose) {
          throw new Error('Strip composer is not available.');
        }
        const result = await compose({
          layout,
          photos: frames.map((uri) => ({ uri })),
        });
        composedUri = result.uri;
      } catch (error) {
        composeError =
          error instanceof Error ? error.message : 'Could not compose the strip.';
      }
      if (cancelled) return;
      router.replace({
        pathname: '/preview',
        params: {
          layout,
          uris: frames.join('|'),
          composedUri,
          composeError,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, layout, router]);

  function fireTick(sound: boolean, haptics: boolean): void {
    if (sound) void playCountdownTick();
    if (haptics) void tickHaptic();
  }

  async function fireShutter(): Promise<void> {
    setFlashActive(flashOn);
    // The OS already plays a shutter sound on capture, so we don't play one.
    if (hapticsOn) void captureHaptic();
    let uri = '';
    try {
      uri = await cameraRef.current!.takePhoto();
    } catch {
      uri = `tinybooth://capture/${captured.current.length}`;
    }
    captured.current.push(uri);
    const nextCount = captured.current.length;
    setFramesCaptured(nextCount);
    setPeekUri(uri);
    setPeekMessage(getRandomMessage());
    if (nextCount >= totalFrames) {
      setPhase('composing');
    } else {
      setPhase('reveal');
    }
  }

  function exitToHome(): void {
    captured.current = [];
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

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
        onCancel={exitToHome}
      />
    );
  }

  const isReveal = phase === 'reveal' && peekUri !== null;

  let hint: string;
  let subhint: string | null = null;
  if (phase === 'get-ready') {
    hint = 'Get ready!';
    subhint = `${totalFrames} photos · ${stripLayoutLabel(layout)}`;
  } else if (phase === 'composing') {
    hint = 'Composing your strip...';
  } else {
    hint = `${framesCaptured} / ${totalFrames}`;
  }

  const getReadyMessage = phase === 'get-ready' ? 'Get ready!' : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.preview}>
        <CameraSurface
          ref={cameraRef}
          flash="off"
          isActive={phase !== 'composing'}
        />
        <SafeCropOverlay frameAspect={frameAspect} accent={theme.colors.primary} />
        {isReveal && peekUri ? (
          <>
            <Image
              source={{ uri: peekUri }}
              style={styles.peek}
              resizeMode="cover"
              accessibilityLabel="Your last shot"
            />
            {peekMessage ? <PeekMessage message={peekMessage} /> : null}
          </>
        ) : null}
        <CountdownOverlay digit={digit} message={getReadyMessage} />
        <ScreenFlash active={flashActive} onDone={() => setFlashActive(false)} />
      </View>

      <View
        pointerEvents="box-none"
        style={[styles.cancel, { top: insets.top + theme.spacing.sm, left: insets.left + theme.spacing.lg }]}
      >
        <IconButton
          icon="close"
          accessibilityLabel="Cancel and leave the booth"
          onPress={exitToHome}
          variant="ghost"
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
