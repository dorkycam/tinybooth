/**
 * Preview screen.
 *
 * Shows the finished strip for the captured frames and surfaces the delivery
 * actions: Print, Share, Redo, Done. Strips also auto-save to the photo
 * library on mount.
 *
 * The capture screen composes the strip (via the Skia bridge) and passes the
 * composed file URI as `composedUri`. If composition failed, the screen falls
 * back to the first captured frame so the buttons still have something to act on
 * and surfaces the error.
 */
import type { JSX } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { saveToCameraRoll, saveFramesToCameraRoll } from '@/lib/cameraRoll';
import { useLayoutClass } from '@/lib/layout';
import {
  DEFAULT_STRIP_LAYOUT,
  parseStripLayout,
  stripLayoutLabel,
} from '@/lib/layouts';
import { printStrip } from '@/lib/print';
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  type SessionSettings,
} from '@/lib/sessionSettings';
import { shareStrip } from '@/lib/share';
import { useTheme } from '@/theme/useTheme';

type AutoSaveState = 'idle' | 'saving' | 'saved' | 'permission_denied' | 'error';

/** How long the preview waits with no taps before closing back to the booth. */
const AUTO_CLOSE_SECONDS = 30;

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { layoutClass } = useLayoutClass();
  const params = useLocalSearchParams<{
    layout?: string;
    uris?: string;
    composedUri?: string;
    composeError?: string;
  }>();
  const layout = parseStripLayout(params.layout) ?? DEFAULT_STRIP_LAYOUT;
  const urisParam = params.uris ?? '';
  const uris = urisParam.split('|').filter(Boolean);
  const composedUriParam = (params.composedUri ?? '').trim();
  const composeError = (params.composeError ?? '').trim();
  // The capture screen supplies the composed strip URI. Fall back to the first
  // frame so the print / share buttons still have something to point at when
  // composition failed.
  const composedUri = composedUriParam || uris[0] || '';
  const [busy, setBusy] = useState<null | 'print' | 'share'>(null);
  const [autoSave, setAutoSave] = useState<AutoSaveState>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(AUTO_CLOSE_SECONDS);
  const [savePreference, setSavePreference] = useState<SessionSettings['saveFrames']>(
    DEFAULT_SESSION_SETTINGS.saveFrames,
  );
  const isTablet = layoutClass === 'tablet';

  // Hydrate the per-app "save individual frames" preference once.
  useEffect(() => {
    let cancelled = false;
    void loadSessionSettings().then((settings) => {
      if (!cancelled) setSavePreference(settings.saveFrames);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-close: after AUTO_CLOSE_SECONDS without interaction, navigate back to
  // the booth so the next group doesn't have to. Any tap resets the timer.
  const autoCloseRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resetIdleTimer = useCallback((): void => {
    setSecondsLeft(AUTO_CLOSE_SECONDS);
  }, []);
  useEffect(() => {
    autoCloseRef.current = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => {
      if (autoCloseRef.current) clearInterval(autoCloseRef.current);
    };
  }, []);
  useEffect(() => {
    if (secondsLeft <= 0) {
      router.back();
    }
  }, [secondsLeft, router]);

  // Auto-save the strip on mount. If the "save individual frames" preference is
  // on, the raw frames save too. Permission was primed before the booth opened,
  // so this is usually a no-op prompt-wise.
  useEffect(() => {
    if (!composedUri) return;
    let cancelled = false;
    setAutoSave('saving');
    const framesToSave = savePreference ? urisParam.split('|').filter(Boolean) : [];
    void (async () => {
      try {
        const result = await saveToCameraRoll(composedUri);
        if (cancelled) return;
        if (result.saved) {
          setAutoSave('saved');
          if (framesToSave.length > 1) {
            void saveFramesToCameraRoll(framesToSave).catch(() => undefined);
          }
        } else if (result.reason === 'permission_denied') {
          setAutoSave('permission_denied');
        } else {
          setAutoSave('error');
        }
      } catch {
        if (!cancelled) setAutoSave('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [composedUri, savePreference, urisParam]);

  async function handlePrint(): Promise<void> {
    if (!composedUri) {
      Alert.alert('No strip yet', 'Take some photos first.');
      return;
    }
    setBusy('print');
    try {
      const result = await printStrip(composedUri);
      if (!result.success && !result.canceled) {
        Alert.alert(
          'Print queue may be stuck',
          'Tap Print again to restart printing.',
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleShare(): Promise<void> {
    if (!composedUri) return;
    setBusy('share');
    try {
      await shareStrip(composedUri);
    } finally {
      setBusy(null);
    }
  }

  function handleRedo(): void {
    router.replace({ pathname: '/(camera)', params: { layout } });
  }

  function handleDone(): void {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      onTouchStart={resetIdleTimer}
    >
      <View style={styles.autoCloseBar}>
        <Text style={[styles.autoCloseText, { color: theme.colors.subtle }]}>
          Closing in {secondsLeft}s
        </Text>
        <View style={[styles.autoCloseTrack, { backgroundColor: theme.colors.hairline }]}>
          <View
            style={[
              styles.autoCloseFill,
              {
                backgroundColor: theme.colors.primary,
                width: `${Math.round((secondsLeft / AUTO_CLOSE_SECONDS) * 100)}%`,
              },
            ]}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          {stripLayoutLabel(layout)}
        </Text>
        <Text style={[styles.autoSave, { color: autoSaveColor(autoSave, theme) }]}>
          {autoSaveLabel(autoSave)}
        </Text>
        <View
          style={[
            styles.stripCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.hairline,
              maxWidth: isTablet ? 480 : 320,
            },
          ]}
        >
          {composedUri ? (
            <Image
              source={{ uri: composedUri }}
              style={styles.stripImage}
              resizeMode="contain"
              accessibilityLabel="Composed photostrip"
            />
          ) : (
            <Text style={[styles.placeholder, { color: theme.colors.subtle }]}>
              {composeError ? 'Could not compose strip.' : 'Loading...'}
            </Text>
          )}
        </View>
        {composeError ? (
          <Text style={[styles.errorText, { color: theme.colors.highlight }]}>
            {composeError}
          </Text>
        ) : null}
        <View style={[styles.actions, isTablet ? styles.actionsTablet : null]}>
          <PrimaryButton label="Print" onPress={handlePrint} disabled={busy !== null} />
          <SecondaryButton label="Share" onPress={handleShare} disabled={busy !== null} />
          <SecondaryButton label="Redo" onPress={handleRedo} disabled={busy !== null} />
          <SecondaryButton label="Done" onPress={handleDone} disabled={busy !== null} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function autoSaveLabel(state: AutoSaveState): string {
  switch (state) {
    case 'idle':
      return ' ';
    case 'saving':
      return 'Saving to your photos...';
    case 'saved':
      return 'Saved to your photos.';
    case 'permission_denied':
      return 'Photo permission off. Enable it in Settings to auto-save strips.';
    case 'error':
      return "Couldn't save automatically. Check your photo library permission.";
  }
}

function autoSaveColor(state: AutoSaveState, theme: ReturnType<typeof useTheme>): string {
  if (state === 'saved') return theme.colors.primary;
  if (state === 'permission_denied' || state === 'error') return theme.colors.highlight;
  return theme.colors.subtle;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  autoCloseBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 6,
  },
  autoCloseText: {
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  autoCloseTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  autoCloseFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  autoSave: {
    fontSize: 13,
    minHeight: 18,
  },
  stripCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    minHeight: 320,
    overflow: 'hidden',
  },
  stripImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholder: {
    fontSize: 17,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actions: {
    width: '100%',
    maxWidth: 360,
    gap: 12,
  },
  actionsTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 720,
  },
});
