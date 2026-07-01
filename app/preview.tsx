/**
 * Preview / delivery screen.
 *
 * A single presentation for every form factor: the composed strip sits centered
 * in the content column with its layout name captioned above it, and the four
 * delivery actions (Print, Save, Share, Redo) live in the one lower-center
 * reachable band via {@link ScreenScaffold}. Close is promoted to fixed screen
 * chrome in the top-right corner. The strip is width-capped (STRIP_MAX_WIDTH,
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
import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AutoCloseBar } from '@/components/AutoCloseBar';
import { DeliveryActions } from '@/components/DeliveryActions';
import { IconButton } from '@/components/IconButton';
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
/** Max width of the strip hero. Tablet portrait keeps tablet sizing; `wide` (tablet landscape) widens. */
const STRIP_MAX_WIDTH = { phone: 320, tablet: 480, wide: 640 } as const;
/** Strip height cap as a fraction of the viewport, by form factor. */
const STRIP_HEIGHT_RATIO = { phone: 0.5, tablet: 0.68 } as const;

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme('dark');
  const router = useRouter();
  const { settings } = useSettings();
  const { layoutClass, presentation } = usePresentation();
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

  // Sizing keys off the form factor (layoutClass) so tablet portrait keeps tablet
  // sizing while rendering the stacked presentation; only the width cap widens.
  const actionSize = ACTION_SIZE[layoutClass];
  const stripMaxWidth =
    presentation === 'wide' ? STRIP_MAX_WIDTH.wide : STRIP_MAX_WIDTH[layoutClass];
  // Cap the strip to a viewport fraction (letterboxed via contain) so a tall strip never hides the actions.
  const stripImageHeight = Math.round(windowHeight * STRIP_HEIGHT_RATIO[layoutClass]);

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

  const content = (
    <View style={styles.content}>
      <AutoCloseBar secondsLeft={secondsLeft} total={idleTotal} style={styles.autoClose} />
      <Text style={[styles.caption, { color: theme.colors.subtle }]}>
        {stripLayoutLabel(layout)}
      </Text>
      <ScrollView
        style={[styles.stripScroll, { maxHeight: stripImageHeight }]}
        contentContainerStyle={styles.stripScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {stripFrame}
      </ScrollView>
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
        saved={saveState === 'saved'}
        disabled={busy !== null}
        size={actionSize}
        scheme="dark"
      />
      <Text style={[styles.saveLine, { color: saveColor(saveState, theme) }]}>
        {saveLabel(saveState)}
      </Text>
    </View>
  );

  const closeButton = (
    <IconButton
      icon="close"
      accessibilityLabel="Done"
      variant="ghost"
      glass
      size={44}
      onPress={handleDone}
      disabled={busy !== null}
      scheme="dark"
      testID="preview-close"
    />
  );

  return (
    <View style={styles.root} onTouchStart={resetIdleTimer}>
      <ScreenScaffold
        presentation={presentation}
        style={{ backgroundColor: theme.colors.bg }}
        topRight={closeButton}
        actionBand={actionBand}
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
  // Centered content column: countdown, layout caption, then the capped strip.
  content: { width: '100%', alignItems: 'center', gap: 12 },
  // Full-width so the countdown text clears the fixed top-right Close.
  autoClose: { alignSelf: 'stretch' },
  caption: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
  // The strip scrolls if it still overflows the viewport fraction; the band never does.
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
  actions: { width: '100%', alignItems: 'center', gap: 8 },
  errorText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 8 },
  saveLine: { fontSize: 13, minHeight: 18, textAlign: 'center' },
  placeholder: { fontSize: 17, paddingVertical: 24 },
});
