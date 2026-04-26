/**
 * Camera screen.
 *
 * Front-facing capture loop with a 3-second countdown per shot. Captures the
 * number of frames the active layout requires (1 to 6), shows a random
 * message after each shot, then routes to the preview screen with the
 * captured URIs threaded through Expo Router params.
 *
 * Tablet layout: large preview with a sidebar of controls in landscape, or a
 * vertical control rail at the bottom in portrait. Phone layout: classic
 * stacked preview + controls.
 */
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StripLayout } from '@tinybooth/api-types';
import { frameCountForLayout } from '@tinybooth/strip-render';
import { CameraSurface } from '@/components/CameraSurface';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { LayoutPicker } from '@/components/LayoutPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useRandomMessage } from '@/hooks/useRandomMessage';
import { useLayoutClass } from '@/lib/layout';
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  saveSessionSettings,
} from '@/lib/sessionSettings';
import { useTheme } from '@/theme/useTheme';

/** Capture loop tick rate. One tick per second of the countdown. */
const TICK_MS = 1000;
/** Countdown starts at 3. */
const COUNTDOWN_FROM = 3;
/** Ms to leave the random message visible before starting the next countdown. */
const MESSAGE_HOLD_MS = 1200;

type Phase = 'idle' | 'countdown' | 'reveal' | 'done';

/** Camera screen entry point. */
export default function CameraScreen(): JSX.Element {
  // Force dark mode on the camera screen regardless of OS scheme. TinyBooth runs
  // on a propped-up tablet at dim-lit venues; a Paper-white background blasts
  // the room and washes out the live preview. Dark venue mode keeps the booth
  // discreet and readable. Per docs/brand/identity.md "Why this palette" notes
  // and PROMPT.md UX polish item #9.
  const theme = useTheme('dark');
  const router = useRouter();
  const { layoutClass, orientation } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';

  const [layout, setLayout] = useState<StripLayout>(DEFAULT_SESSION_SETTINGS.layout);
  const [flash, setFlash] = useState<boolean>(DEFAULT_SESSION_SETTINGS.flash);
  const [phase, setPhase] = useState<Phase>('idle');
  const [digit, setDigit] = useState<number | null>(null);
  const [framesCaptured, setFramesCaptured] = useState<number>(0);
  const captured = useRef<string[]>([]);
  const { message, reveal, hide } = useRandomMessage();
  const totalFrames = useMemo<number>(() => frameCountForLayout(layout), [layout]);

  // Hydrate persisted settings on mount.
  useEffect(() => {
    let cancelled = false;
    void loadSessionSettings().then((settings) => {
      if (cancelled) return;
      setLayout(settings.layout);
      setFlash(settings.flash);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Drive the capture loop. One full pass per frame: countdown then reveal.
  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    let current = COUNTDOWN_FROM;
    setDigit(current);
    const interval = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(interval);
        setDigit(null);
        // Shutter would fire here in the real native build. We record a
        // synthetic file URI placeholder; the Skia bridge composes from real
        // capture URIs once VisionCamera is wired in the host build.
        captured.current.push(`tinybooth://capture/${captured.current.length}`);
        const nextCount = captured.current.length;
        setFramesCaptured(nextCount);
        reveal();
        if (nextCount >= totalFrames) {
          setTimeout(() => {
            setPhase('done');
          }, MESSAGE_HOLD_MS);
        } else {
          setPhase('reveal');
        }
        return;
      }
      setDigit(current);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [phase, reveal, totalFrames]);

  // Reveal phase: hold the random message, then go back into countdown.
  useEffect(() => {
    if (phase !== 'reveal') return undefined;
    const timer = setTimeout(() => {
      hide();
      setPhase('countdown');
    }, MESSAGE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase, hide]);

  // Hand off captured frames to the preview screen.
  useEffect(() => {
    if (phase !== 'done') return;
    router.replace({
      pathname: '/(camera)/preview',
      params: {
        layout,
        uris: captured.current.join('|'),
      },
    });
  }, [phase, router, layout]);

  function startCapture(): void {
    captured.current = [];
    setFramesCaptured(0);
    hide();
    setPhase('countdown');
  }

  function handleLayoutChange(next: StripLayout): void {
    setLayout(next);
    void saveSessionSettings({ layout: next });
  }

  function handleFlashToggle(): void {
    const next = !flash;
    setFlash(next);
    void saveSessionSettings({ flash: next });
  }

  const sidebarFirst = isTablet && orientation === 'landscape';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      <View style={[styles.flex, sidebarFirst ? styles.rowReverse : styles.column]}>
        <View style={styles.previewWrap}>
          <CameraSurface flash={flash ? 'on' : 'off'} isActive={phase !== 'done'} />
          <CountdownOverlay digit={digit} message={phase === 'reveal' ? message : null} />
          <View style={styles.topRow} pointerEvents="box-none">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              hitSlop={12}
              style={[styles.iconButton, { backgroundColor: theme.colors.surface }]}
            >
              <Text style={[styles.iconText, { color: theme.colors.fg }]}>Close</Text>
            </Pressable>
            <Pressable
              onPress={handleFlashToggle}
              accessibilityRole="switch"
              accessibilityState={{ checked: flash }}
              hitSlop={12}
              style={[
                styles.iconButton,
                { backgroundColor: flash ? theme.colors.coral : theme.colors.surface },
              ]}
            >
              <Text
                style={[styles.iconText, { color: flash ? '#FFFFFF' : theme.colors.fg }]}
              >
                Flash {flash ? 'on' : 'off'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.statusRow} pointerEvents="none">
            <Text style={[styles.statusText, { color: theme.colors.bg }]}>
              {framesCaptured} / {totalFrames}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.controls,
            sidebarFirst ? styles.controlsSidebar : styles.controlsBottom,
            { backgroundColor: theme.colors.bg },
          ]}
        >
          <LayoutPicker value={layout} onChange={handleLayoutChange} />
          <View style={{ height: 16 }} />
          <PrimaryButton
            label={phase === 'idle' ? 'Start' : 'Capturing...'}
            onPress={startCapture}
            disabled={phase !== 'idle'}
            testID="start-capture"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  column: {
    flexDirection: 'column',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  previewWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  controls: {
    padding: 24,
  },
  controlsBottom: {
    width: '100%',
  },
  controlsSidebar: {
    width: 360,
    justifyContent: 'center',
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  iconText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 18, 22, 0.55)',
    overflow: 'hidden',
  },
});
