/**
 * Preview / delivery screen.
 *
 * A modal-feel card centered over the booth background shows the composed strip
 * and the delivery actions (Print, Save, Share, Redo) plus a Close control in
 * the card's top-right corner. The close control and the action row stay pinned
 * at every screen size: the strip is capped to a fraction of the viewport
 * (resizeMode="contain") and, on phones, sits in a ScrollView so a tall Classic
 * strip can never push the actions off the bottom. Save asks for the
 * photo-library permission in context the first time it is tapped.
 *
 * The capture screen passes the composed file URI as `composedUri`; if
 * composition failed it falls back to the first captured frame so the buttons
 * still have something to act on, and surfaces the error.
 *
 * Kiosk behavior: after the idle timeout with no taps the session is discarded
 * and the booth returns to Start. Any tap restarts the timer (wired through the
 * root `onTouchStart`).
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AutoCloseBar } from '@/components/AutoCloseBar';
import { DeliveryActions } from '@/components/DeliveryActions';
import { IconButton } from '@/components/IconButton';
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

/** Circle diameter for the delivery actions, by form factor. */
const ACTION_SIZE = { phone: 60, tablet: 72 } as const;
/** Max width of the strip hero, by form factor. */
const STRIP_MAX_WIDTH = { phone: 320, tablet: 480 } as const;
const STRIP_HEIGHT_RATIO = { phone: 0.5, tablet: 0.68 } as const;

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme();
  const router = useRouter();
  const { settings } = useSettings();
  const { layoutClass } = useLayoutClass();
  const { height: windowHeight } = useWindowDimensions();
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

  // Discard the session and return to Start. Also the idle-timeout handler.
  const handleDone = useCallback((): void => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [router]);
  const { secondsLeft, reset: resetIdleTimer } = useIdleReset(settings.idleReset, handleDone);
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

  const actionSize = isTablet ? ACTION_SIZE.tablet : ACTION_SIZE.phone;
  const stripMaxWidth = isTablet ? STRIP_MAX_WIDTH.tablet : STRIP_MAX_WIDTH.phone;
  // Cap the strip to a viewport fraction (letterboxed via contain) so a tall strip never hides the actions.
  const stripImageHeight = Math.round(windowHeight * STRIP_HEIGHT_RATIO[isTablet ? 'tablet' : 'phone']);
  const stripFrame = (
    <View
      style={[
        styles.stripFrame,
        {
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.hairline,
          borderRadius: theme.radius.lg,
          maxWidth: stripMaxWidth,
        },
      ]}
    >
      {composedUri ? (
        <Image
          source={{ uri: composedUri }}
          style={[styles.stripImage, { height: stripImageHeight }]}
          resizeMode="contain"
          accessibilityLabel="Composed photostrip"
        />
      ) : (
        <Text style={[styles.placeholder, { color: theme.colors.subtle }]}>
          {composeError ? 'Could not compose strip.' : 'Loading...'}
        </Text>
      )}
    </View>
  );

  const controls = (
    <View style={[styles.controls, { gap: theme.spacing.md }]}>
      {composeError ? (
        <Text style={[styles.errorText, { color: theme.colors.highlight }]}>{composeError}</Text>
      ) : null}
      <DeliveryActions
        onPrint={handlePrint}
        onSave={handleSave}
        onShare={handleShare}
        onRedo={handleRedo}
        saved={saveState === 'saved'}
        disabled={busy !== null}
        size={actionSize}
      />
      <Text style={[styles.saveLine, { color: saveColor(saveState, theme) }]}>
        {saveLabel(saveState)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      onTouchStart={resetIdleTimer}
    >
      <AutoCloseBar secondsLeft={secondsLeft} total={idleTotal} />
      <View style={styles.center}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.hairline,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xl,
              gap: theme.spacing.lg,
              maxWidth: isTablet ? 640 : 380,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.title, { color: theme.colors.subtle }]}>
              {stripLayoutLabel(layout)}
            </Text>
            <IconButton
              icon="close"
              accessibilityLabel="Done"
              variant="ghost"
              glass
              size={44}
              onPress={handleDone}
              disabled={busy !== null}
              testID="preview-close"
            />
          </View>

          {isTablet ? (
            <View style={[styles.body, styles.bodyTablet]}>
              {stripFrame}
              {controls}
            </View>
          ) : (
            <View style={styles.body}>
              <ScrollView
                style={styles.stripScroll}
                contentContainerStyle={styles.stripScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {stripFrame}
              </ScrollView>
              {controls}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

/** Human-readable status line for the current save state. */
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

/** Theme color for the save status line based on its state. */
function saveColor(state: SaveState, theme: ReturnType<typeof useTheme>): string {
  if (state === 'saved') return theme.colors.primary;
  if (state === 'permission_denied' || state === 'error') return theme.colors.highlight;
  return theme.colors.subtle;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  // flexShrink lets the card cap at the available height so the pinned action
  // row and close control stay on screen even when the strip is very tall.
  card: { width: '100%', borderWidth: 1, alignItems: 'stretch', flexShrink: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  // Phone: column with a shrinkable strip area above pinned controls.
  body: { width: '100%', alignItems: 'center', gap: 16, flexShrink: 1 },
  bodyTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    flexShrink: 1,
  },
  // The strip scrolls if it still overflows; the controls below never do.
  stripScroll: { alignSelf: 'stretch', flexShrink: 1 },
  stripScrollContent: { alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  stripFrame: {
    width: '100%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  stripImage: { width: '100%' },
  controls: { alignItems: 'center', flexShrink: 0 },
  errorText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 8 },
  saveLine: { fontSize: 13, minHeight: 18, textAlign: 'center' },
  placeholder: { fontSize: 17, paddingVertical: 24 },
});
