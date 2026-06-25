/**
 * Camera screen - the live booth.
 *
 * Fullscreen front-camera preview. Gear icon in the top-right opens the booth
 * controls sheet (flash / layout / exit). Big tap-anywhere area kicks off the
 * 3-2-1 countdown with audio ticks and a shutter snap on each capture.
 *
 * A safe-crop overlay shows guests exactly what part of the frame will end up
 * on the strip.
 *
 * After the last shot the screen composes the strip via the Skia bridge and
 * routes to the preview with the composed strip URI (plus the raw frame URIs so
 * the optional "save individual frames" preference still works).
 */
import type { JSX } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BoothControlsSheet } from '@/components/BoothControlsSheet';
import { CameraSurface, type CameraSurfaceHandle } from '@/components/CameraSurface';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { PermissionPrimer } from '@/components/PermissionPrimer';
import { SafeCropOverlay } from '@/components/SafeCropOverlay';
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
import type { SkiaBridge } from '@/lib/skiaBridge';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Countdown starts at 3. */
const COUNTDOWN_FROM = 3;
/** Ms to leave the just-captured peek visible before the next countdown. */
const PEEK_HOLD_MS = 1200;

type Phase = 'idle' | 'countdown' | 'reveal' | 'composing' | 'done';
type PermStep = 'priming-camera' | 'priming-library' | 'ready';

/** Camera screen entry point. */
export default function CameraScreen(): JSX.Element {
  const theme = useTheme('dark');
  const router = useRouter();
  const params = useLocalSearchParams<{
    layout?: string;
    flash?: string;
  }>();
  const initialLayout = parseStripLayout(params.layout) ?? DEFAULT_STRIP_LAYOUT;
  const [layout, setLayout] = useState<StripLayout>(initialLayout);
  // The safe-crop overlay matches the per-cell aspect of the chosen layout so
  // guests see exactly what lands on the strip.
  const frameAspect = useMemo<number>(() => frameAspectForLayout(layout), [layout]);

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
  const totalFrames = useMemo<number>(() => shotCountForLayout(layout), [layout]);

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

  // Reveal/peek phase: hold the just-captured shot then loop into another
  // countdown.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const timer = setTimeout(() => {
      setPhase('countdown');
    }, PEEK_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // After the last frame, compose the strip via the Skia bridge and route to
  // preview with the composed strip URI. The raw frame URIs ride along so the
  // optional "save individual frames" preference still works on the preview.
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
        composeError = error instanceof Error ? error.message : 'Could not compose the strip.';
      }
      if (cancelled) return;
      router.push({
        pathname: '/(camera)/preview',
        params: {
          layout,
          uris: frames.join('|'),
          composedUri,
          composeError,
        },
      });
      captured.current = [];
      setFramesCaptured(0);
      setPhase('idle');
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, layout, router]);

  async function fireShutter(): Promise<void> {
    try {
      const uri = await cameraRef.current!.takePhoto();
      captured.current.push(uri);
    } catch {
      captured.current.push(`tinybooth://capture/${captured.current.length}`);
    }
    const nextCount = captured.current.length;
    setFramesCaptured(nextCount);
    if (nextCount >= totalFrames) {
      setTimeout(() => setPhase('composing'), PEEK_HOLD_MS);
    } else {
      setPhase('reveal');
    }
  }

  function startCapture(): void {
    if (phase !== 'idle' || controlsOpen) return;
    captured.current = [];
    setFramesCaptured(0);
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
          'We use the camera to take photos in the booth. Photos stay on this device. ' +
          'TinyBooth never uploads anything.'
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
        title="Save your strips to Photos."
        body={
          'TinyBooth can save every strip to your Photos library so you have a copy to ' +
          'share or print later. We only write strips you create here, nothing else.'
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
        <CountdownOverlay digit={digit} message={null} />
      </Pressable>

      {/* Top bar: gear icon. */}
      <View pointerEvents="box-none" style={styles.topBar}>
        <View />
        <Pressable
          onPress={() => setControlsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Booth controls"
          hitSlop={16}
          style={[styles.gearButton, { backgroundColor: 'rgba(15, 18, 22, 0.55)' }]}
        >
          <Text style={styles.gearIcon}>{'⚙'}</Text>
        </Pressable>
      </View>

      {/* Bottom hint. */}
      {phase === 'idle' ? (
        <View pointerEvents="none" style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>Tap anywhere to start</Text>
          <Text style={styles.bottomHintSub}>{totalFrames} photos · {stripLayoutLabel(layout)}</Text>
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
        onExit={exitToHome}
      />
    </View>
  );
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
