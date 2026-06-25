/**
 * In-camera paywall. Surfaced when the host taps "Upgrade event" from the
 * camera or preview screen. Two-card layout (Event Pass + Event Pass Plus)
 * that triggers RevenueCat IAP via `purchase()`.
 *
 * Anti-steering: this screen NEVER references the web URL or the cheaper
 * Stripe price. Apple's anti-steering rules outside the US still bite even
 * after the May 2025 ruling per docs/research/monetization.md.
 *
 * Cal-AI safety (Apple removed Cal AI April 2026 for paywall design):
 * 1. Show the actual billed amount large (`$14.99`), never a per-day
 *    equivalent.
 * 2. Consumables only at launch; auto-renewal language is not applicable.
 * 3. If the user hits "Maybe later" we close the modal. No sequential
 *    second-chance prompts.
 * 4. No external buy buttons or web price hints, IAP only on iOS.
 * See docs/research/iteration-2026-04.md for the source.
 *
 * Tablet: cards laid out side by side. Phone: stacked.
 */
import type { JSX } from 'react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  EVENT_PASS,
  EVENT_PASS_PLUS,
  type Product,
} from '@tinybooth/billing';
import { Wordmark } from '@/components/Wordmark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useEntitlementSnapshot } from '@/hooks/useEntitlement';
import { useLayoutClass } from '@/lib/layout';
import { purchase, restorePurchases } from '@/lib/iap';
import { useTheme } from '@/theme/useTheme';

const EVENT_PASS_FEATURES: readonly string[] = [
  '150 guest uploads',
  'Custom branding (logo + colors)',
  '60 day photo retention',
  '50 email or SMS deliveries',
  'Bulk export from the dashboard',
  'Watermark removed from strips',
];

const EVENT_PASS_PLUS_FEATURES: readonly string[] = [
  'Unlimited guest uploads',
  'Custom branding (logo + colors)',
  '90 day photo retention',
  '250 email or SMS deliveries',
  'Bulk export from the dashboard',
  'Watermark removed from strips',
  'Add up to 50 custom random messages',
  'Priority IG share render',
];

/** Paywall screen entry point. */
export default function PaywallScreen(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { layoutClass } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';
  const { active, refresh } = useEntitlementSnapshot();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleBuy(productId: string): Promise<void> {
    setBusy(productId);
    try {
      const result = await purchase(productId);
      if (result.success) {
        await refresh();
        Alert.alert('Thanks for the support!', 'Your event has been upgraded.');
        router.back();
      } else if (result.errorMessage === 'cancelled') {
        // Silent cancel.
      } else {
        Alert.alert('Purchase failed', result.errorMessage ?? 'Please try again.');
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(): Promise<void> {
    setBusy('restore');
    try {
      const snap = await restorePurchases();
      if (snap.activeEntitlements.size > 0) {
        await refresh();
        Alert.alert('Restored', 'Your previous purchases are active again.');
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases were found.');
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="lg" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Upgrade your event</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          Branded strips, more guest uploads, longer photo retention. Pay once per event.
        </Text>

        <View style={[styles.cards, isTablet ? styles.cardsTablet : null]}>
          <PriceCard
            product={EVENT_PASS}
            features={EVENT_PASS_FEATURES}
            isCurrent={active.has('event_pass')}
            isHighlighted={false}
            busy={busy === EVENT_PASS.id}
            onBuy={() => void handleBuy(EVENT_PASS.id)}
          />
          <PriceCard
            product={EVENT_PASS_PLUS}
            features={EVENT_PASS_PLUS_FEATURES}
            isCurrent={active.has('event_pass_plus')}
            isHighlighted
            busy={busy === EVENT_PASS_PLUS.id}
            onBuy={() => void handleBuy(EVENT_PASS_PLUS.id)}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleRestore()}
          disabled={busy !== null}
          style={({ pressed }) => [
            styles.restore,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.restoreLabel, { color: theme.colors.subtle }]}>
            Restore purchases
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cancel,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.cancelLabel, { color: theme.colors.subtle }]}>
            Maybe later
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface PriceCardProps {
  product: Product;
  features: readonly string[];
  isCurrent: boolean;
  isHighlighted: boolean;
  busy: boolean;
  onBuy: () => void;
}

function PriceCard({
  product,
  features,
  isCurrent,
  isHighlighted,
  busy,
  onBuy,
}: PriceCardProps): JSX.Element {
  const theme = useTheme();
  const dollars = (product.priceUsdCents.iap / 100).toFixed(2);
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: isHighlighted ? theme.colors.primary : theme.colors.hairline,
          borderWidth: isHighlighted ? 2 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.colors.fg }]}>{product.name}</Text>
        {isHighlighted ? (
          <Text style={[styles.cardBadge, { color: '#FFFFFF', backgroundColor: theme.colors.primary }]}>
            BEST VALUE
          </Text>
        ) : null}
      </View>
      <Text style={[styles.cardPrice, { color: theme.colors.fg }]}>${dollars}</Text>
      <Text style={[styles.cardPriceUnit, { color: theme.colors.subtle }]}>one-time, per event</Text>
      <View style={styles.featureList}>
        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={[styles.featureCheck, { color: theme.colors.primary }]}>{'\u2713'}</Text>
            <Text style={[styles.featureText, { color: theme.colors.fg }]}>{f}</Text>
          </View>
        ))}
      </View>
      <PrimaryButton
        label={isCurrent ? 'Already active' : busy ? 'Loading...' : `Continue, $${dollars}`}
        onPress={onBuy}
        disabled={busy || isCurrent}
      />
    </View>
  );
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 480,
  },
  cards: {
    width: '100%',
    gap: 16,
    marginTop: 20,
  },
  cardsTablet: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    minWidth: 280,
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardPrice: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: 12,
  },
  cardPriceUnit: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  featureList: {
    gap: 8,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  featureCheck: {
    fontSize: 14,
    fontWeight: '700',
    width: 16,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  restore: {
    marginTop: 16,
    padding: 12,
  },
  restoreLabel: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cancel: {
    marginTop: 4,
    padding: 12,
  },
  cancelLabel: {
    fontSize: 14,
  },
});
