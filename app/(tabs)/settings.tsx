/**
 * Settings screen.
 *
 * Three controls:
 * - Default flash on/off (persisted via AsyncStorage).
 * - Default layout pick (persisted via AsyncStorage).
 * - QA "preview class" override so designers can force phone or tablet
 *   layout without resizing the simulator.
 *
 * About section shows the app version (read from `expo-constants`) plus links
 * to help and privacy.
 */
import type { JSX } from 'react';
import Constants from 'expo-constants';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutPicker } from '@/components/LayoutPicker';
import { Wordmark } from '@/components/Wordmark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { useSession } from '@/hooks/useSession';
import { deleteAccount } from '@/lib/accountApi';
import { revokeAppleToken } from '@/lib/auth';
import {
  DEFAULT_SESSION_SETTINGS,
  loadSessionSettings,
  saveSessionSettings,
  type PreviewClassOverride,
  type SessionSettings,
} from '@/lib/sessionSettings';
import { useThemePreference, type ThemePreference } from '@/theme/ThemeContext';
import { useTheme } from '@/theme/useTheme';

const PREVIEW_CHOICES: PreviewClassOverride[] = ['auto', 'phone', 'tablet'];
const THEME_CHOICES: ThemePreference[] = ['system', 'light', 'dark'];

/** Settings tab. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const router = useRouter();
  const session = useSession();
  const themePref = useThemePreference();
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SESSION_SETTINGS);
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSessionSettings().then((next) => {
      if (!cancelled) setSettings(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(patch: Partial<SessionSettings>): void {
    const next = { ...settings, ...patch };
    setSettings(next);
    void saveSessionSettings(patch);
  }

  async function handleDeleteAccount(): Promise<void> {
    if (!session.session) return;
    setDeleting(true);
    try {
      // Apple requires SIWA token revoke as part of account deletion (2024+).
      // Best-effort: failure here does not block the rest of the cascade,
      // because the row delete still removes the user's data.
      try {
        const baseUrl =
          process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://tinybooth.com';
        await revokeAppleToken(session.session.accessToken, baseUrl);
      } catch {
        // swallowed; the server-side revoke endpoint logs the error.
      }
      await deleteAccount(session.session.accessToken, session.session.userId);
      await session.signOut();
      Alert.alert('Account deleted', 'Your account and every event you owned were removed.');
      router.replace('/');
    } catch (err) {
      Alert.alert('Could not delete', (err as Error).message);
    } finally {
      setDeleting(false);
      setConfirmStep(0);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Settings</Text>

        <Section title="Capture defaults" theme={theme}>
          <Row title="Flash on by default" theme={theme}>
            <Switch
              value={settings.flash}
              onValueChange={(value) => update({ flash: value })}
            />
          </Row>
          <Row title="Default layout" theme={theme}>
            <View style={{ alignSelf: 'stretch' }}>
              <LayoutPicker
                value={settings.layout}
                onChange={(layout) => update({ layout })}
              />
            </View>
          </Row>
          <Row title="Save individual frames" theme={theme}>
            <Switch
              value={settings.saveFrames}
              onValueChange={(value) => update({ saveFrames: value })}
            />
          </Row>
        </Section>

        <Section title="Appearance" theme={theme}>
          <View style={styles.previewRow}>
            {THEME_CHOICES.map((choice) => {
              const selected = themePref.preference === choice;
              return (
                <Pressable
                  key={choice}
                  onPress={() => void themePref.setPreference(choice)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.previewChip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.hairline,
                    },
                  ]}
                >
                  <Text
                    style={{ color: selected ? '#FFFFFF' : theme.colors.fg, fontWeight: '600' }}
                  >
                    {choice}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="QA preview" theme={theme}>
          <View style={styles.previewRow}>
            {PREVIEW_CHOICES.map((choice) => {
              const selected = settings.previewClass === choice;
              return (
                <Pressable
                  key={choice}
                  onPress={() => update({ previewClass: choice })}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.previewChip,
                    {
                      backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.hairline,
                    },
                  ]}
                >
                  <Text
                    style={{ color: selected ? '#FFFFFF' : theme.colors.fg, fontWeight: '600' }}
                  >
                    {choice}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="About" theme={theme}>
          <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
            Version {Constants.expoConfig?.version ?? '0.0.0'}
          </Text>
          <Link href="/(tabs)/help" style={[styles.link, { color: theme.colors.primary }]}>
            Help and event setup
          </Link>
          <Link href="/(tabs)/privacy" style={[styles.link, { color: theme.colors.primary }]}>
            Privacy
          </Link>
          <Link href="/(tabs)/event" style={[styles.link, { color: theme.colors.primary }]}>
            Connect to event
          </Link>
        </Section>

        {session.session ? (
          <Section title="Account" theme={theme}>
            <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
              Signed in as {session.session.email ?? session.session.userId}
            </Text>
            <SecondaryButton label="Sign out" onPress={() => void session.signOut()} />
            {confirmStep === 0 ? (
              <PrimaryButton label="Delete account" onPress={() => setConfirmStep(1)} />
            ) : null}
            {confirmStep === 1 ? (
              <View style={{ gap: 8 }}>
                <Text style={[styles.aboutLine, { color: theme.colors.fg }]}>
                  This removes your account, every event you own, and the photos
                  attached to those events. There is no undo. Continue?
                </Text>
                <PrimaryButton label="Yes, continue" onPress={() => setConfirmStep(2)} />
                <SecondaryButton label="Cancel" onPress={() => setConfirmStep(0)} />
              </View>
            ) : null}
            {confirmStep === 2 ? (
              <View style={{ gap: 8 }}>
                <Text style={[styles.aboutLine, { color: theme.colors.primary }]}>
                  Last confirmation. Tap delete to permanently remove the account.
                </Text>
                <PrimaryButton
                  label={deleting ? 'Deleting...' : 'Delete forever'}
                  onPress={() => void handleDeleteAccount()}
                  disabled={deleting}
                />
                <SecondaryButton label="Cancel" onPress={() => setConfirmStep(0)} />
              </View>
            ) : null}
          </Section>
        ) : null}
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

interface RowProps {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}

function Row({ title, theme, children }: RowProps): JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowTitle, { color: theme.colors.fg }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: {
    fontSize: 32,
    fontWeight: '700',
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
  previewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  previewChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  aboutLine: {
    fontSize: 15,
  },
  link: {
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
