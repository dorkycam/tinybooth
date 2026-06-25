/**
 * Booth setup screen.
 *
 * Shown when the host taps "Start a booth" from Home. Captures the per-session
 * choices (event/session name, layout, flash) before opening the live camera.
 *
 * Defaults are loaded from persisted settings; the host can override per
 * session and the override is also saved back so the next session starts with
 * their last picks. Hitting "Start session" hands the values off to the
 * camera screen via Expo Router params.
 */
import type { JSX } from 'react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StripLayout } from '@tinybooth/api-types';
import { LayoutPicker } from '@/components/LayoutPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  saveSessionSettings,
} from '@/lib/sessionSettings';
import { useTheme } from '@/theme/useTheme';

/** Booth setup screen entry point. */
export default function BoothSetupScreen(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [layout, setLayout] = useState<StripLayout>(DEFAULT_SESSION_SETTINGS.layout);
  const [flash, setFlash] = useState<boolean>(DEFAULT_SESSION_SETTINGS.flash);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadSessionSettings().then((settings) => {
      if (cancelled) return;
      setLayout(settings.layout);
      setFlash(settings.flash);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function startSession(): void {
    const trimmedName = name.trim();
    const trimmedPasscode = passcode.trim();
    if (trimmedPasscode.length > 0 && !/^\d{4,8}$/.test(trimmedPasscode)) {
      setPasscodeError('Passcode must be 4 to 8 digits.');
      return;
    }
    setPasscodeError(null);
    void saveSessionSettings({ layout, flash });
    router.replace({
      pathname: '/(camera)',
      params: {
        sessionName: trimmedName,
        layout,
        flash: flash ? '1' : '0',
        passcode: trimmedPasscode,
      },
    });
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Set up the booth</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtle }]}>
          Pick what kind of strip people get tonight. You can change it later by ending and
          starting a new session.
        </Text>

        <Section title="Session name (optional)" theme={theme}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Cam's birthday"
            placeholderTextColor={theme.colors.subtle}
            autoCapitalize="words"
            returnKeyType="done"
            maxLength={60}
            style={[
              styles.input,
              {
                color: theme.colors.fg,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.hairline,
              },
            ]}
          />
          <Text style={[styles.hint, { color: theme.colors.subtle }]}>
            Tag every strip from this session with a name so you can find them later.
          </Text>
        </Section>

        <Section title="Layout" theme={theme}>
          <LayoutPicker value={layout} onChange={setLayout} />
        </Section>

        <Section title="End-event passcode (optional)" theme={theme}>
          <TextInput
            value={passcode}
            onChangeText={(value) => {
              setPasscode(value.replace(/\D/g, '').slice(0, 8));
              if (passcodeError) setPasscodeError(null);
            }}
            placeholder="4 to 8 digits"
            placeholderTextColor={theme.colors.subtle}
            keyboardType="number-pad"
            secureTextEntry
            returnKeyType="done"
            maxLength={8}
            style={[
              styles.input,
              {
                color: theme.colors.fg,
                backgroundColor: theme.colors.surface,
                borderColor: passcodeError ? theme.colors.highlight : theme.colors.hairline,
              },
            ]}
          />
          {passcodeError ? (
            <Text style={[styles.hint, { color: theme.colors.highlight }]}>{passcodeError}</Text>
          ) : (
            <Text style={[styles.hint, { color: theme.colors.subtle }]}>
              When set, ending the event from the booth requires this passcode so guests can't
              accidentally exit. Stored only on this device.
            </Text>
          )}
        </Section>

        <Section title="Flash" theme={theme}>
          <View style={styles.row}>
            <Text style={[styles.rowTitle, { color: theme.colors.fg }]}>Flash on by default</Text>
            <Switch value={flash} onValueChange={setFlash} />
          </View>
          <Text style={[styles.hint, { color: theme.colors.subtle }]}>
            Most front-camera flashes brighten the screen. Useful in dim venues.
          </Text>
        </Section>

        <View style={styles.actions}>
          <PrimaryButton label="Start session" onPress={startSession} />
          <SecondaryButton label="Cancel" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SectionProps {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}

function Section({ title, theme, children }: SectionProps): JSX.Element {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.subtle }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 17,
    flex: 1,
  },
  actions: {
    marginTop: 8,
    gap: 12,
  },
});
