/**
 * Camera screen — the live booth.
 *
 * Fullscreen front-camera preview. Session name pill in the top-left, gear
 * icon in the top-right (opens BoothControlsSheet for flash / layout / end
 * session). Big tap-anywhere area kicks off the 3-2-1 countdown with audio
 * ticks + a shutter snap on each capture.
 *
 * A safe-crop overlay shows guests exactly what part of the frame will end up
 * on the strip (matches the active layout's per-frame aspect).
 *
 * After the last shot, the Skia bridge composes the strip into a JPEG and
 * the preview screen receives the composed file URI (not the raw frames).
 */
import type { JSX } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StripLayout } from '@tinybooth/api-types';
import { computeLayout, frameCountForLayout } from '@tinybooth/strip-render';
import { composeStripWithSkia } from '@tinybooth/strip-render/skia';
import { BoothControlsSheet } from '@/components/BoothControlsSheet';
import { CameraSurface, type CameraSurfaceHandle } from '@/components/CameraSurface';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { SafeCropOverlay } from '@/components/SafeCropOverlay';
import { useRandomMessage } from '@/hooks/useRandomMessage';
import {
  getCameraPermissionStatus,
  getMediaLibraryPermissionStatus,
  requestCameraPermission,
  requestMediaLibraryPermission,
  type PermissionStatus,
} from '@/lib/permissions';
import { saveSessionSettings } from '@/lib/sessionSettings';
import {
  playCountdownTick,
  preloadBoothSounds,
  releaseBoothSounds,
} from '@/lib/sounds';
import { useTheme } from '@/theme/useTheme';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Countdown starts at 3. */
const COUNTDOWN_FROM = 3;
/** Ms to leave the random message visible before starting the next countdown. */
const MESSAGE_HOLD_MS = 1200;

type Phase = 'idle' | 'countdown' | 'reveal' | 'composing' | 'done';
type PermStep = 'priming-camera' | 'priming-library' | 'ready';

/** Camera screen entry point. */
export default function CameraScreen(): JSX.Element {
  const theme = useTheme('dark');
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionName?: string;
    layout?: string;
    flash?: string;
    passcode?: string;
  }>();
  const sessionName = (params.sessionName ?? '').trim();
  const passcode = (params.passcode ?? '').trim();
  const initialLayout = parseLayout(params.layout) ?? '1x4_classic';
  const [layout, setLayout] = useState<StripLayout>(initialLayout);
  const layoutResult = useMemo(() => computeLayout(layout), [layout]);
  const frameAspect = useMemo<number>(() => {
    const f = layoutResult.frames[0];
    return f && f.h > 0 ? f.w / f.h : 1;
  }, [layoutResult]);

  const [permStep, setPermStep] = useState<PermStep>('priming-camera');
  const [cameraStatus, setCameraStatus] = useState<PermissionStatus>('unknown');
  const [libraryStatus, setLibraryStatus] = useState<PermissionStatus>('unknown');

  const [flash, setFlash] = useState<boolean>(params.flash === '1');
  const [phase, setPhase] = useState<Phase>('idle');
  const [digit, setDigit] = useState<number | null>(null);
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);
  const captured = useRef<string[]>([]);
  const cameraRef = useRef<CameraSurfaceHandle | null>(null);
  const { message, reveal, hide } = useRandomMessage();
  const totalFrames = useMemo<number>(() => frameCountForLayout(layout), [layout]);

  // Permission state on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cam = await getCameraPermissionStatus();
      const lib = await getMediaLibraryPermissionStatus();
      if (cancelled) return;
      setCameraStatus(cam);
      setLibraryStatus(lib);
      if (cam === 'granted' && lib === 'granted') {
        setPermStep('ready');
      } else if (cam === 'granted') {
        setPermStep('priming-library');
      } else {
        setPermStep('priming-camera');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Preload sounds once permissions are clear.
  useEffect(() => {
    if (permStep !== 'ready') return;
    void preloadBoothSounds();
    return () => {
      releaseBoothSounds();
    };
  }, [permStep]);

  // Drive the countdown.
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    let current = COUNTDOWN_FROM;
    setDigit(current);
    void playCountdownTick();
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setDigit(null);
        // Camera capture itself triggers the iOS system shutter sound; we
        // intentionally don't play our own snap on top of it.
        void fireShutter();
        return;
      }
      setDigit(current);
      void playCountdownTick();
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // Reveal phase: hold the random message then loop into another countdown.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const timer = setTimeout(() => {
      hide();
      setPhase('countdown');
    }, MESSAGE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, hide]);

  // Composition: after the last frame, await Skia and route to preview.
  useEffect(() => {
    if (phase !== 'composing') return;
    let cancelled = false;
    void (async () => {
      try {
        const composed = await composeStripWithSkia({
          layout,
          photos: captured.current.map((uri) => ({ uri })),
        });
        if (cancelled) return;
        router.push({
          pathname: '/(camera)/preview',
          params: {
            layout,
            composedUri: composed.uri,
            uris: captured.current.join('|'),
            sessionName,
          },
        });
      } catch (err) {
        if (cancelled) return;
        // Fall back to passing raw frames so the user can still try Print/Share.
        router.push({
          pathname: '/(camera)/preview',
          params: {
            layout,
            uris: captured.current.join('|'),
            sessionName,
            composeError: (err as Error).message,
          },
        });
      } finally {
        if (!cancelled) {
          captured.current = [];
          setFramesCaptured(0);
          setPhase('idle');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, layout, router, sessionName]);

  async function fireShutter(): Promise<void> {
    try {
      const uri = await cameraRef.current!.takePhoto();
      captured.current.push(uri);
    } catch {
      captured.current.push(`tinybooth://capture/${captured.current.length}`);
    }
    const nextCount = captured.current.length;
    setFramesCaptured(nextCount);
    reveal();
    if (nextCount >= totalFrames) {
      setTimeout(() => setPhase('composing'), MESSAGE_HOLD_MS);
    } else {
      setPhase('reveal');
    }
  }

  function startCapture(): void {
    if (phase !== 'idle' || controlsOpen) return;
    captured.current = [];
    setFramesCaptured(0);
    hide();
    setPhase('countdown');
  }

  function handleFlashChange(next: boolean): void {
    setFlash(next);
    void saveSessionSettings({ flash: next });
  }

  function handleLayoutChange(next: StripLayout): void {
    if (next === layout) return;
    captured.current = [];
    setFramesCaptured(0);
    setDigit(null);
    setPhase('idle');
    setLayout(next);
    void saveSessionSettings({ layout: next });
  }

  function exitToHome(): void {
    setControlsOpen(false);
    captured.current = [];
    setFramesCaptured(0);
    setDigit(null);
    setPhase('idle');
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }

  function handleEndSession(): void {
    exitToHome();
  }

  function handleEndEvent(): void {
    exitToHome();
  }

  async function handleCameraContinue(): Promise<void> {
    const next = await requestCameraPermission();
    setCameraStatus(next);
    if (next === 'granted') {
      if (libraryStatus !== 'granted') {
        setPermStep('priming-library');
      } else {
        setPermStep('ready');
      }
    }
  }

  async function handleLibraryContinue(): Promise<void> {
    const next = await requestMediaLibraryPermission();
    setLibraryStatus(next);
    setPermStep('ready');
  }

  if (permStep === 'priming-camera') {
    return (
      <PermissionPrimer
        title="TinyBooth needs your camera."
        body={
          'We use the camera to take photos in the booth. Photos stay on this device unless ' +
          'you connect this booth to an event. We never upload anything in the background.'
        }
        permanentlyDenied={cameraStatus === 'denied'}
        onContinue={() => void handleCameraContinue()}
        onCancel={() => router.back()}
      />
    );
  }

  if (permStep === 'priming-library') {
    return (
      <PermissionPrimer
        title="Save your strips automatically."
        body={
          'TinyBooth saves every strip to your Photos library so you have a copy you can ' +
          'share or download later. We only write strips you create here, nothing else.'
        }
        permanentlyDenied={libraryStatus === 'denied'}
        onContinue={() => void handleLibraryContinue()}
        onCancel={() => setPermStep('ready')}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <Pressable
        style={styles.previewTap}
        onPress={startCapture}
        accessibilityRole="button"
        accessibilityLabel="Start the photo countdown"
        accessibilityHint="Stand inside the rectangle and tap anywhere to begin."
      >
        <CameraSurface ref={cameraRef} flash={flash ? 'on' : 'off'} isActive={phase !== 'composing'} />
        <SafeCropOverlay frameAspect={frameAspect} accent={theme.colors.primary} />
        <CountdownOverlay digit={digit} message={phase === 'reveal' ? message : null} />
      </Pressable>

      {/* Top bar: session pill (when named) + gear icon. */}
      <View pointerEvents="box-none" style={styles.topBar}>
        {sessionName ? (
          <View
            style={[styles.sessionPill, { backgroundColor: 'rgba(15, 18, 22, 0.55)' }]}
            pointerEvents="none"
          >
            <Text style={styles.sessionText}>{sessionName}</Text>
          </View>
        ) : (
          <View />
        )}
        <Pressable
          onPress={() => setControlsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Booth controls"
          hitSlop={16}
          style={[styles.gearButton, { backgroundColor: 'rgba(15, 18, 22, 0.55)' }]}
        >
          <Text style={styles.gearIcon}>{'\u2699'}</Text>
        </Pressable>
      </View>

      {/* Bottom hint. */}
      {phase === 'idle' ? (
        <View pointerEvents="none" style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>Tap anywhere to start</Text>
          <Text style={styles.bottomHintSub}>{totalFrames} photos · {layoutLabel(layout)}</Text>
        </View>
      ) : phase === 'composing' ? (
        <View pointerEvents="none" style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>Composing your strip...</Text>
        </View>
      ) : (
        <View pointerEvents="none" style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>
            {framesCaptured} / {totalFrames}
          </Text>
        </View>
      )}

      <BoothControlsSheet
        visible={controlsOpen}
        onDismiss={() => setControlsOpen(false)}
        flash={flash}
        onFlashChange={handleFlashChange}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onEndSession={handleEndSession}
        onEndEvent={handleEndEvent}
        passcode={passcode || null}
      />
    </View>
  );
}

function parseLayout(value: string | undefined): StripLayout | null {
  switch (value) {
    case '1x4_classic':
    case '2x2':
    case '1x3':
    case 'single':
    case '1x6_double':
      return value;
    default:
      return null;
  }
}

function layoutLabel(layout: StripLayout): string {
  switch (layout) {
    case '1x4_classic':
      return 'classic strip';
    case '2x2':
      return '2x2 grid';
    case '1x3':
      return 'tall strip';
    case 'single':
      return 'single';
    case '1x6_double':
      return 'long strip';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  previewTap: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    maxWidth: '70%',
  },
  sessionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    color: '#FFFFFF',
    fontSize: 22,
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
