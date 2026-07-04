/**
 * Preview / delivery screen.
 *
 * A single presentation for every form factor: the composed strip sits centered
 * in the content column with its layout name captioned above it, and the delivery
 * actions (Print, then optionally Save and Share, then Redo and Done) live in the
 * one lower-center reachable band via {@link ScreenScaffold}. Done discards the
 * session and returns to Start; it replaces the old top-right Close. Save and
 * Share can each be hidden via Settings. The strip is width-capped (STRIP_MAX_WIDTH,
 * widened only for the `wide` presentation) and height-capped to a viewport
 * fraction (STRIP_HEIGHT_RATIO, resizeMode "contain") inside a ScrollView, so a
 * tall Classic strip can never push the action band off-screen. Save asks for
 * the photo-library permission in context the first time it is tapped.
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
import { useCallback } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AutoCloseBar } from '@/components/AutoCloseBar';
import { DeliveryActions } from '@/components/DeliveryActions';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { useIdleReset } from '@/hooks/useIdleReset';
import { useSettings } from '@/hooks/useSettings';
import { useStripDelivery } from '@/hooks/useStripDelivery';
import type { SaveState } from '@/hooks/useStripDelivery';
import { usePresentation } from '@/lib/PresentationContext';
import { DEFAULT_STRIP_LAYOUT, parseStripLayout, stripLayoutLabel } from '@/lib/layouts';
import { useTheme } from '@/theme/useTheme';

/** Circle diameter for the delivery actions, by form factor. */
const ACTION_SIZE = { phone: 60, tablet: 72 } as const;

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme('dark');
  const router = useRouter();
  const { settings } = useSettings();
  const { layoutClass, presentation } = usePresentation();
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

  const { busy, saveState, print, save, share } = useStripDelivery({
    composedUri,
    uris,
    saveFrames: settings.saveFrames,
  });

  // Discard the session and return to Start. Also the idle-timeout handler.
  const handleDone = useCallback((): void => {
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [router]);
  const { secondsLeft, reset: resetIdleTimer } = useIdleReset(settings.idleReset, handleDone);
  const idleTotal = settings.idleReset === 'never' ? 0 : settings.idleReset;

  function handleRedo(): void {
    router.replace({ pathname: '/capture', params: { layout } });
  }

  // Action circles key off the form factor so tablet portrait keeps tablet sizing.
  const actionSize = ACTION_SIZE[layoutClass];

  const content = (
    <View style={styles.content}>
      <AutoCloseBar secondsLeft={secondsLeft} total={idleTotal} style={styles.autoClose} />
      <Text style={[styles.caption, { color: theme.colors.subtle }]}>
        {stripLayoutLabel(layout)}
      </Text>
      {composedUri ? (
        <Image
          source={{ uri: composedUri }}
          style={styles.stripImage}
          resizeMode="contain"
          accessibilityLabel="Composed photostrip"
        />
      ) : (
        <View style={styles.placeholderWrap}>
          <Text style={[styles.placeholder, { color: theme.colors.subtle }]}>
            {composeError ? 'Could not compose strip.' : 'Loading...'}
          </Text>
        </View>
      )}
    </View>
  );

  const actionBand = (
    <View style={styles.actions}>
      {composeError ? (
        <Text style={[styles.errorText, { color: theme.colors.highlight }]}>{composeError}</Text>
      ) : null}
      <DeliveryActions
        onPrint={print}
        onSave={save}
        onShare={share}
        onRedo={handleRedo}
        onDone={handleDone}
        saved={saveState === 'saved'}
        disabled={busy !== null}
        showSave={settings.showSave}
        showShare={settings.showShare}
        size={actionSize}
        scheme="dark"
      />
      <Text style={[styles.saveLine, { color: saveColor(saveState, theme) }]}>
        {saveLabel(saveState)}
      </Text>
    </View>
  );

  return (
    <View style={styles.root} onTouchStart={resetIdleTimer}>
      <ScreenScaffold
        presentation={presentation}
        style={{ backgroundColor: theme.colors.bg }}
        actionBand={actionBand}
        contentFill
      >
        {content}
      </ScreenScaffold>
    </View>
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
  // Fills the scaffold content region: countdown, caption, then the strip image.
  content: { flex: 1, width: '100%', alignItems: 'center', gap: 12 },
  // Full-width so the countdown text clears the fixed top-right Close.
  autoClose: { alignSelf: 'stretch' },
  caption: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  // The strip fills the remaining space, letterboxed to its aspect via `contain`.
  stripImage: { flex: 1, width: '100%' },
  placeholderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { width: '100%', alignItems: 'center', gap: 8 },
  errorText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 8 },
  saveLine: { fontSize: 13, minHeight: 18, textAlign: 'center' },
  placeholder: { fontSize: 17, paddingVertical: 24 },
});
