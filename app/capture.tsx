/**
 * Capture screen: the live booth.
 *
 * Full-screen mirrored front-camera preview. Tap anywhere to begin a 4-shot
 * session. For each shot: a countdown (length from Settings, default 3s) with
 * optional ticking sound and haptics, then capture (shutter sound, haptic, brief
 * white screen-flash), then a ~1.2s passive peek of the just-captured shot, then
 * the next shot. After 4 shots the strip is composed via the Skia bridge and the
 * screen routes to Preview with the composed strip URI.
 *
 * No per-shot accept or reject. Settings drive the feedback toggles; the layout
 * is chosen on the previous screen and passed in as a route param.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraSurface, type CameraSurfaceHandle } from '@/components/CameraSurface';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { SafeCropOverlay } from '@/components/SafeCropOverlay';
import { ScreenFlash } from '@/components/ScreenFlash';
import { captureHaptic, tickHaptic } from '@/lib/haptics';
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
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  type CountdownLength,
} from '@/lib/sessionSettings';
import {
  playCountdownTick,
  preloadBoothSounds,
  releaseBoothSounds,
} from '@/lib/sounds';
import { useTheme } from '@/theme/useTheme';
import type { SkiaBridge } from '@/lib/skiaBridge';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Ms to leave the just-captured peek visible before the next countdown. */
const PEEK_HOLD_MS = 1200;

type Phase = 'idle' | 'countdown' | 'reveal' | 'composing';
type PermStep = 'checking' | 'priming-camera' | 'ready';

/** Capture screen entry point. */
export default function CaptureScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme('dark');
  const router = useRouter();
  const params = useLocalSearchParams<{ layout?: string }>();
  const layout: StripLayout = parseStripLayout(params.layout) ?? DEFAULT_STRIP_LAYOUT;
  const frameAspect = useMemo<number>(() => frameAspectForLayout(layout), [layout]);
  const totalFrames = useMemo<number>(() => shotCountForLayout(layout), [layout]);

  const [permStep, setPermStep] = useState<PermStep>('checking');
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('unknown');

  // Feedback preferences, hydrated from Settings on mount.
  const [countdownFrom, setCountdownFrom] = useState<CountdownLength>(
    DEFAULT_SESSION_SETTINGS.countdown,
  );
  const [soundOn, setSoundOn] = useState<boolean>(DEFAULT_SESSION_SETTINGS.sound);
  const [hapticsOn, setHapticsOn] = useState<boolean>(DEFAULT_SESSION_SETTINGS.haptics);
  const [flashOn, setFlashOn] = useState<boolean>(DEFAULT_SESSION_SETTINGS.flash);

  const [phase, setPhase] = useState<Phase>('idle');
  const [digit, setDigit] = useState<number | null>(null);
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const [peekUri, setPeekUri] = useState<string | null>(null);
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

  // Hydrate feedback preferences from Settings.
  useEffect(() => {
    let cancelled = false;
    void loadSessionSettings().then((settings) => {
      if (cancelled) return;
      setCountdownFrom(settings.countdown);
      setSoundOn(settings.sound);
      setHapticsOn(settings.haptics);
      setFlashOn(settings.flash);
    });
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
    if (nextCount >= totalFrames) {
      setPhase('composing');
    } else {
      setPhase('reveal');
    }
  }

  function startCapture(): void {
    if (phase !== 'idle') return;
    captured.current = [];
    setFramesCaptured(0);
    setPeekUri(null);
    setPhase('countdown');
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

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <Pressable
        style={styles.previewTap}
        onPress={startCapture}
        accessibilityRole="button"
        accessibilityLabel="Start the photo countdown"
        accessibilityHint="Stand inside the rectangle and tap anywhere to begin."
      >
        <CameraSurface
          ref={cameraRef}
          flash={flashOn ? 'on' : 'off'}
          isActive={phase !== 'composing'}
        />
        <SafeCropOverlay frameAspect={frameAspect} accent={theme.colors.primary} />
        {isReveal && peekUri ? (
          <Image
            source={{ uri: peekUri }}
            style={styles.peek}
            resizeMode="cover"
            accessibilityLabel="Your last shot"
          />
        ) : null}
        <CountdownOverlay digit={digit} message={null} />
        <ScreenFlash active={flashActive} onDone={() => setFlashActive(false)} />
      </Pressable>

      <View pointerEvents="box-none" style={styles.topBar}>
        <Pressable
          onPress={exitToHome}
          accessibilityRole="button"
          accessibilityLabel="Exit the booth"
          hitSlop={16}
          style={styles.exitButton}
        >
          <Text style={styles.exitIcon}>{'✕'}</Text>
        </Pressable>
        <View />
      </View>

      <View pointerEvents="none" style={styles.bottomHint}>
        {phase === 'idle' ? (
          <>
            <Text style={styles.bottomHintText}>Tap anywhere to start</Text>
            <Text style={styles.bottomHintSub}>
              {totalFrames} photos · {stripLayoutLabel(layout)}
            </Text>
          </>
        ) : phase === 'composing' ? (
          <Text style={styles.bottomHintText}>Composing your strip...</Text>
        ) : (
          <Text style={styles.bottomHintText}>
            {framesCaptured} / {totalFrames}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  previewTap: { flex: 1 },
  peek: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 18, 22, 0.55)',
  },
  exitIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bottomHint: {
    position: 'absolute',
    bottom: 56,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 18, 22, 0.55)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  bottomHintText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomHintSub: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 2,
    opacity: 0.85,
  },
});
