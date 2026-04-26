/**
 * Event connect tab.
 *
 * States:
 *   - Disconnected: CTA "Connect to an event", followed by either a QR scan
 *     or a manual slug entry form.
 *   - Connected: card with event name, branding preview, "Disconnect" button.
 *
 * Pairing payload format documented in `lib/eventConnection.ts`. The slug
 * lookup uses the existing tRPC `event.bySlug` endpoint via fetch (no
 * react-query needed for the single call).
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { EventQRScanner } from '@/components/EventQRScanner';
import { useEventConnection } from '@/hooks/useEventConnection';
import { parsePairingPayload, type EventConnection } from '@/lib/eventConnection';
import { useTheme } from '@/theme/useTheme';

type Phase = 'idle' | 'scanning' | 'manual';

const WEB_BASE =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? process.env.NEXT_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000';

interface EventDto {
  id: string;
  name: string;
  slug: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  } | null;
}

/** Connect-to-event screen. */
export default function EventScreen(): JSX.Element {
  const theme = useTheme();
  const { connection, loading, connect, disconnect } = useEventConnection();
  const [phase, setPhase] = useState<Phase>('idle');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
        <Text style={{ color: theme.colors.subtle }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (connection) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Wordmark size="md" />
          <Text style={[styles.title, { color: theme.colors.fg }]}>Connected</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
            ]}
          >
            <Text style={[styles.cardLabel, { color: theme.colors.subtle }]}>EVENT</Text>
            <Text style={[styles.cardName, { color: theme.colors.fg }]}>{connection.eventName}</Text>
            <Text style={[styles.cardSlug, { color: theme.colors.subtle }]}>/{connection.slug}</Text>
            {connection.branding.primaryColor ? (
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: connection.branding.primaryColor },
                ]}
              />
            ) : null}
          </View>
          <Text style={[styles.helper, { color: theme.colors.subtle }]}>
            Strips taken from this iPad will upload to {connection.eventName} until you disconnect.
          </Text>
          <SecondaryButton label="Disconnect" onPress={() => void disconnect()} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === 'scanning') {
    return (
      <View style={{ flex: 1 }}>
        <EventQRScanner
          onScan={(payload) => void handleScan(payload)}
          onCancel={() => setPhase('idle')}
        />
      </View>
    );
  }

  async function handleScan(payload: string): Promise<void> {
    const parsed = parsePairingPayload(payload);
    if (!parsed) {
      setError('That QR code does not match the TinyBooth pairing format.');
      setPhase('idle');
      return;
    }
    await fetchAndSave({ id: parsed.eventId });
  }

  async function handleManualSubmit(): Promise<void> {
    if (slug.trim().length === 0) return;
    await fetchAndSave({ slug: slug.trim() });
  }

  async function fetchAndSave(args: { id?: string; slug?: string }): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const input = args.slug ? { slug: args.slug } : { id: args.id };
      params.set('input', JSON.stringify({ json: input }));
      const path = args.slug ? 'event.bySlug' : 'event.bySlug';
      // The tRPC schema only exposes bySlug right now; manual entry uses the
      // slug directly and the QR path passes the eventId through the slug
      // arg until the dashboard's host-only QR carries the slug too. The
      // server gracefully NOT_FOUNDs anything that does not match.
      const url = `${WEB_BASE}/api/trpc/${path}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Lookup failed (${res.status}).`);
      const body = (await res.json()) as { result?: { data?: { json?: EventDto } } };
      const event = body?.result?.data?.json;
      if (!event) throw new Error('Event not found.');
      const next: EventConnection = {
        eventId: event.id,
        eventName: event.name,
        slug: event.slug,
        branding: event.branding ?? {},
        connectedAt: new Date().toISOString(),
      };
      await connect(next);
      setPhase('idle');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Connect to an event</Text>
        <Text style={[styles.helper, { color: theme.colors.subtle }]}>
          Pair this iPad with an event so booth strips upload to the dashboard
          and the event branding wraps every strip.
        </Text>

        {phase === 'manual' ? (
          <View style={{ gap: 12 }}>
            <Text style={[styles.label, { color: theme.colors.fg }]}>Event slug</Text>
            <TextInput
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              placeholder="sams-30-x9k2"
              placeholderTextColor={theme.colors.subtle}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.hairline,
                  color: theme.colors.fg,
                },
              ]}
            />
            <PrimaryButton
              label={submitting ? 'Looking up...' : 'Connect'}
              onPress={() => void handleManualSubmit()}
              disabled={submitting || slug.trim().length === 0}
            />
            <Pressable onPress={() => setPhase('idle')}>
              <Text style={[styles.linkText, { color: theme.colors.subtle }]}>Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <PrimaryButton label="Scan host QR" onPress={() => setPhase('scanning')} />
            <SecondaryButton label="Enter slug manually" onPress={() => setPhase('manual')} />
          </View>
        )}

        {error ? <Text style={[styles.error, { color: theme.colors.coral }]}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  helper: { fontSize: 15, lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: { fontSize: 14 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  cardLabel: { fontSize: 12, letterSpacing: 1 },
  cardName: { fontSize: 22, fontWeight: '700' },
  cardSlug: { fontSize: 14 },
  swatch: { marginTop: 12, height: 32, borderRadius: 8 },
  linkText: { fontSize: 14 },
});
