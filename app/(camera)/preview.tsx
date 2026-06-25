/**
 * Preview screen.
 *
 * Shows the composed photostrip for the captured frames and surfaces the four
 * post-capture actions: Print, Share, Save, Redo. The Skia composition is
 * deferred to the host app's bridge (see `src/lib/skiaBridge.ts`); when the
 * bridge is unavailable we render a placeholder card so the screen still
 * lays out correctly under typecheck and unit tests.
 */
import type { JSX } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StripLayout } from '@tinybooth/api-types';
import { computeLayout } from '@tinybooth/strip-render';
import { DeliveryPanel } from '@/components/DeliveryPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useEventConnection } from '@/hooks/useEventConnection';
import { saveToCameraRoll, saveFramesToCameraRoll } from '@/lib/cameraRoll';
import { useLayoutClass } from '@/lib/layout';
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
    stripId?: string;
    sessionName?: string;
  }>();
  const layout = parseLayout(params.layout) ?? '1x4_classic';
  const urisParam = params.uris ?? '';
  const uris = urisParam.split('|').filter(Boolean);
  const composedUriParam = (params.composedUri ?? '').trim();
  const composeError = (params.composeError ?? '').trim();
  const sessionName = (params.sessionName ?? '').trim();
  const stripUnlock = useEntitlement('strip_unlock');
  const { connection } = useEventConnection();
  const branding = connection
    ? {
        logoUrl: connection.branding.logoUrl,
        primaryColor: connection.branding.primaryColor,
        accentColor: connection.branding.accentColor,
      }
    : undefined;
  const layoutResult = computeLayout(layout, { branding });
  const accentColor = branding?.accentColor ?? branding?.primaryColor;
  // Phase 2: the composed file URI is supplied by the Skia bridge (host app).
  // Until the bridge is wired, fall back to the first capture URI so the
  // print / share / save buttons still have something to act on.
  // Prefer the Skia-composed strip; fall back to the first frame so the print
  // / share buttons still have something to point at if composition failed.
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
  // the booth so the next group doesn't have to. Any tap inside the screen
  // resets the timer.
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

  // Auto-save the composed strip on mount. No manual Save button — every strip
  // lands in the camera roll automatically. If the host has the
  // "Save individual frames" preference on, raw frames save too. Permission
  // was primed before the booth opened, so this is usually a no-op
  // prompt-wise.
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
    // urisParam is a stable string; uris (the array) was the previous
    // unstable dep that caused the effect to re-run on every render.
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
          'Tap Print again to restart printing. The TinyBooth app will cycle the printer for you.',
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
          {sessionName ? `${sessionName} · ${layoutLabel(layout)}` : layoutLabel(layout)}
        </Text>
        <Text style={[styles.autoSave, { color: autoSaveColor(autoSave, theme) }]}>
          {autoSaveLabel(autoSave)}
        </Text>
        <View
          style={[
            styles.stripCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: accentColor ?? theme.colors.hairline,
              borderWidth: accentColor ? 4 : 1,
              aspectRatio: layoutResult.canvas.w / layoutResult.canvas.h,
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
        {!stripUnlock && !composeError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove the wordmark"
            onPress={() => router.push('/(camera)/strip-unlock')}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Text style={[styles.unlockHint, { color: theme.colors.subtle }]}>
              Tap to remove the tinybooth.com wordmark.
            </Text>
          </Pressable>
        ) : null}
        <View style={[styles.actions, isTablet ? styles.actionsTablet : null]}>
          <PrimaryButton label="Print" onPress={handlePrint} disabled={busy !== null} />
          <SecondaryButton label="Share" onPress={handleShare} disabled={busy !== null} />
          <SecondaryButton label="Close" onPress={() => router.back()} disabled={busy !== null} />
          {connection ? (
            <SecondaryButton
              label="Upgrade event"
              onPress={() => router.push('/(camera)/paywall')}
              disabled={busy !== null}
            />
          ) : null}
        </View>
        {connection ? (
          <View style={styles.delivery}>
            <Text style={[styles.deliveryTitle, { color: theme.colors.subtle }]}>
              Send to a guest
            </Text>
            <DeliveryPanel stripId={params.stripId ?? null} />
          </View>
        ) : null}
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
      return "Photo permission off. Enable it in Settings to auto-save strips.";
    case 'error':
      return "Couldn't save automatically. Try again from your photo library settings.";
  }
}

function autoSaveColor(state: AutoSaveState, theme: ReturnType<typeof useTheme>): string {
  if (state === 'saved') return theme.colors.primary;
  if (state === 'permission_denied' || state === 'error') return theme.colors.highlight;
  return theme.colors.subtle;
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
      return 'Classic 1x4 strip';
    case '2x2':
      return '2x2 grid';
    case '1x3':
      return 'Tall 1x3 strip';
    case 'single':
      return 'Single postcard';
    case '1x6_double':
      return 'Long 1x6 strip';
    default:
      return '';
  }
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
  unlockHint: {
    fontSize: 13,
    textDecorationLine: 'underline',
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
  delivery: {
    width: '100%',
    maxWidth: 480,
    gap: 8,
    marginTop: 24,
    alignItems: 'center',
  },
  deliveryTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
