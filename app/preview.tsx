/**
 * Preview / delivery screen.
 *
 * Shows the composed strip and the delivery actions: Print, Save, Share, Redo,
 * Done. Save asks for the photo-library permission in context the first time it
 * is tapped (handled inside `saveToCameraRoll`).
 *
 * The capture screen composes the strip via the Skia bridge and passes the
 * composed file URI as `composedUri`. If composition failed, the screen falls
 * back to the first captured frame so the buttons still have something to act on
 * and surfaces the error.
 *
 * Kiosk behavior: after an idle timeout with no taps, the session is discarded
 * and the booth returns to Start. Every tap restarts the timer.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useIdleReset } from '@/hooks/useIdleReset';
import { useSettings } from '@/hooks/useSettings';
import { saveFramesToCameraRoll, saveToCameraRoll } from '@/lib/cameraRoll';
import { useLayoutClass } from '@/lib/layout';
import { DEFAULT_STRIP_LAYOUT, parseStripLayout, stripLayoutLabel } from '@/lib/layouts';
import { printStrip } from '@/lib/print';
import { shareStrip } from '@/lib/share';
import { useTheme } from '@/theme/useTheme';

type SaveState = 'idle' | 'saving' | 'saved' | 'permission_denied' | 'error';
type BusyAction = 'print' | 'save' | 'share';

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
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
  // Fall back to the first frame so the buttons still have something to point at
  // when composition failed.
  const composedUri = composedUriParam || uris[0] || '';
  const isTablet = layoutClass === 'tablet';

  const [busy, setBusy] = useState<BusyAction | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Idle reset: after the configured timeout without taps, return to Start.
  const handleIdleTimeout = useCallback((): void => {
    handleDone();
  }, []);
  const { secondsLeft, reset: resetIdleTimer } = useIdleReset(
    settings.idleReset,
    handleIdleTimeout,
  );
  const idleTotal = settings.idleReset === 'never' ? 0 : settings.idleReset;

  async function handlePrint(): Promise<void> {
    if (!composedUri) {
      Alert.alert('No strip yet', 'Take some photos first.');
      return;
    }
    setBusy('print');
    try {
      const result = await printStrip(composedUri);
      if (!result.success && !result.canceled) {
        Alert.alert('Print queue may be stuck', 'Tap Print again to restart printing.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleSave(): Promise<void> {
    if (!composedUri) return;
    setBusy('save');
    setSaveState('saving');
    try {
      const result = await saveToCameraRoll(composedUri);
      if (result.saved) {
        setSaveState('saved');
        if (settings.saveFrames && uris.length > 1) {
          void saveFramesToCameraRoll(uris).catch(() => undefined);
        }
      } else if (result.reason === 'permission_denied') {
        setSaveState('permission_denied');
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
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
    router.replace({ pathname: '/capture', params: { layout } });
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
      {secondsLeft !== null ? (
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
                  width: `${idleTotal > 0 ? Math.round((secondsLeft / idleTotal) * 100) : 0}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          {stripLayoutLabel(layout)}
        </Text>
        <Text style={[styles.saveLine, { color: saveColor(saveState, theme) }]}>
          {saveLabel(saveState)}
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
          <SecondaryButton
            label={saveState === 'saved' ? 'Saved' : 'Save'}
            onPress={handleSave}
            disabled={busy !== null || saveState === 'saved'}
          />
          <SecondaryButton label="Share" onPress={handleShare} disabled={busy !== null} />
          <SecondaryButton label="Redo" onPress={handleRedo} disabled={busy !== null} />
          <SecondaryButton label="Done" onPress={handleDone} disabled={busy !== null} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function saveLabel(state: SaveState): string {
  switch (state) {
    case 'idle':
      return ' ';
    case 'saving':
      return 'Saving to your photos...';
    case 'saved':
      return 'Saved to your photos.';
    case 'permission_denied':
      return 'Photo permission off. Enable it in Settings to save strips.';
    case 'error':
      return "Couldn't save. Check your photo library permission.";
  }
}

function saveColor(state: SaveState, theme: ReturnType<typeof useTheme>): string {
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
  saveLine: {
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
