/**
 * Strip Unlock bottom-sheet modal.
 *
 * One-shot $1.99 IAP that removes the wordmark from the user's most recent
 * standalone strip. Triggered by tapping the watermark on the preview screen.
 * IAP only by design (the web has no booth surface, and Apple 3.1.1 says
 * watermark removal must be IAP per docs/research/monetization.md).
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STRIP_UNLOCK } from '@tinybooth/billing';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useEntitlementSnapshot } from '@/hooks/useEntitlement';
import { purchase } from '@/lib/iap';
import { useTheme } from '@/theme/useTheme';

/** Strip Unlock modal entry. */
export default function StripUnlockModal(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const { refresh, active } = useEntitlementSnapshot();
  const [busy, setBusy] = useState(false);

  const dollars = (STRIP_UNLOCK.priceUsdCents.iap / 100).toFixed(2);
  const alreadyUnlocked = active.has('strip_unlock');

  async function handleBuy(): Promise<void> {
    setBusy(true);
    try {
      const r = await purchase(STRIP_UNLOCK.id);
      if (r.success) {
        await refresh();
        Alert.alert('Unlocked', 'The wordmark is gone from your most recent strip.');
        router.back();
      } else if (r.errorMessage === 'cancelled') {
        // Silent cancel.
      } else {
        Alert.alert('Purchase failed', r.errorMessage ?? 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.handle} />
      <View style={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Remove the wordmark</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          {STRIP_UNLOCK.description} One-time purchase.
        </Text>
        <Text style={[styles.price, { color: theme.colors.fg }]}>${dollars}</Text>
        <PrimaryButton
          label={alreadyUnlocked ? 'Already unlocked' : busy ? 'Loading...' : `Continue, $${dollars}`}
          onPress={() => void handleBuy()}
          disabled={busy || alreadyUnlocked}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.cancelLabel, { color: theme.colors.subtle }]}>Maybe later</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15,18,22,0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 360,
  },
  price: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 8,
  },
  cancel: {
    marginTop: 16,
    padding: 12,
  },
  cancelLabel: {
    fontSize: 14,
  },
});
