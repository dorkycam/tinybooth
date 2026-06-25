/**
 * Email + SMS delivery panel for the preview screen.
 *
 * Shown only when the booth is paired with an event. The server enforces tier
 * gating; if the event is FREE, the deliver mutation throws TIER_REQUIRED and
 * we route the host to the in-app paywall.
 */
import type { JSX } from 'react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { deliverStrip } from '@/lib/stripDelivery';
import { useTheme } from '@/theme/useTheme';
import { loadSession } from '@/lib/auth';

interface DeliveryPanelProps {
  /** Strip id returned from `strip.create`. Required to deliver. */
  stripId: string | null;
}

/** Render the delivery picker. Tablet: side-by-side. Phone: stacked. */
export function DeliveryPanel({ stripId }: DeliveryPanelProps): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<'idle' | 'email' | 'sms'>('idle');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSend(): Promise<void> {
    if (!stripId) {
      Alert.alert('Save the strip first', 'Take a strip before sending.');
      return;
    }
    if (!recipient || recipient.length === 0) return;
    setBusy(true);
    try {
      const session = await loadSession();
      const r = await deliverStrip(
        {
          stripId,
          channel: mode === 'email' ? 'email' : 'sms',
          email: mode === 'email' ? recipient : undefined,
          phone: mode === 'sms' ? recipient : undefined,
        },
        session?.accessToken,
        session?.userId,
      );
      if (r.ok) {
        Alert.alert('Sent', `Strip delivered via ${r.channel}.`);
        setRecipient('');
        setMode('idle');
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('TIER_REQUIRED')) {
        Alert.alert(
          'Upgrade required',
          'Email and text delivery are part of Event Pass. Open the upgrade screen?',
          [
            { text: 'Maybe later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/(camera)/paywall') },
          ],
        );
      } else if (message.includes('Delivery quota exhausted')) {
        Alert.alert('Out of deliveries', 'This event has used its delivery quota.');
      } else {
        Alert.alert('Send failed', message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (mode === 'idle') {
    return (
      <View style={styles.row}>
        <SecondaryButton label="Email me" onPress={() => setMode('email')} />
        <SecondaryButton label="Text me" onPress={() => setMode('sms')} />
      </View>
    );
  }

  return (
    <View style={styles.input}>
      <Text style={[styles.label, { color: theme.colors.subtle }]}>
        {mode === 'email' ? 'Your email' : 'Your phone (e.g. +13105550100)'}
      </Text>
      <TextInput
        value={recipient}
        onChangeText={setRecipient}
        keyboardType={mode === 'email' ? 'email-address' : 'phone-pad'}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={mode === 'email' ? 'name@example.com' : '+13105550100'}
        placeholderTextColor={theme.colors.subtle}
        style={[
          styles.field,
          {
            color: theme.colors.fg,
            borderColor: theme.colors.hairline,
            backgroundColor: theme.colors.surface,
          },
        ]}
      />
      <View style={styles.row}>
        <PrimaryButton label={busy ? 'Sending...' : 'Send'} onPress={() => void handleSend()} disabled={busy} />
        <SecondaryButton label="Cancel" onPress={() => setMode('idle')} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 420,
    gap: 8,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
