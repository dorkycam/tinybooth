/**
 * Preview screen.
 *
 * Shows the composed photostrip for the captured frames and surfaces the four
 * post-capture actions: Print, Share, Save, Redo. The Skia composition is
 * deferred to the host app's bridge (see `src/lib/skiaBridge.ts`); when the
 * bridge is unavailable we render a placeholder card so the screen still
 * lays out correctly under typecheck and unit tests.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StripLayout } from '@tinybooth/api-types';
import { computeLayout } from '@tinybooth/strip-render';
import { DeliveryPanel } from '@/components/DeliveryPanel';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useEventConnection } from '@/hooks/useEventConnection';
import { saveToCameraRoll } from '@/lib/cameraRoll';
import { useLayoutClass } from '@/lib/layout';
import { printStrip } from '@/lib/print';
import { shareStrip } from '@/lib/share';
import { useTheme } from '@/theme/useTheme';

/** Preview screen entry point. */
export default function PreviewScreen(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { layoutClass } = useLayoutClass();
  const params = useLocalSearchParams<{ layout?: string; uris?: string; stripId?: string }>();
  const layout = parseLayout(params.layout) ?? '1x4_classic';
  const uris = (params.uris ?? '').split('|').filter(Boolean);
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
  const composedUri = uris[0] ?? '';
  const [busy, setBusy] = useState<null | 'print' | 'share' | 'save'>(null);
  const isTablet = layoutClass === 'tablet';

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

  async function handleSave(): Promise<void> {
    if (!composedUri) return;
    setBusy('save');
    try {
      const result = await saveToCameraRoll(composedUri);
      if (!result.saved && result.reason === 'permission_denied') {
        Alert.alert(
          'Photo permission needed',
          "TinyBooth can't save to your camera roll without photo access. Open Settings to grant it.",
        );
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          {layoutLabel(layout)}
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
          <Text style={[styles.placeholder, { color: theme.colors.subtle }]}>
            {uris.length} photo{uris.length === 1 ? '' : 's'} captured
          </Text>
          {layoutResult.footer?.kind === 'logo' ? (
            <Text
              style={[
                styles.watermark,
                { color: branding?.primaryColor ?? theme.colors.fg },
              ]}
            >
              {connection?.eventName ?? 'event logo'}
            </Text>
          ) : !stripUnlock ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove the wordmark"
              onPress={() => router.push('/(camera)/strip-unlock')}
              style={({ pressed }) => [styles.watermark, { opacity: pressed ? 0.5 : 1 }]}
            >
              <Text style={[styles.watermarkText, { color: theme.colors.fg }]}>
                tinybooth.com
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={[styles.actions, isTablet ? styles.actionsTablet : null]}>
          <PrimaryButton label="Print" onPress={handlePrint} disabled={busy !== null} />
          <SecondaryButton label="Share" onPress={handleShare} disabled={busy !== null} />
          <SecondaryButton label="Save" onPress={handleSave} disabled={busy !== null} />
          <SecondaryButton label="Redo" onPress={() => router.back()} disabled={busy !== null} />
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
  stripCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 320,
  },
  placeholder: {
    fontSize: 17,
  },
  watermark: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  watermarkText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
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
