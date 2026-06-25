/**
 * Settings screen.
 *
 * Capture defaults (flash, default layout, save individual frames), appearance
 * (system / light / dark), a QA preview-class override, and an About section
 * with the app version. Everything persists locally via AsyncStorage; the app
 * has no account and collects nothing.
 */
import type { JSX } from 'react';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutPicker } from '@/components/LayoutPicker';
import { Wordmark } from '@/components/Wordmark';
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

/** Settings screen. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const themePref = useThemePreference();
  const [settings, setSettings] = useState<SessionSettings>(DEFAULT_SESSION_SETTINGS);

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
                    style={{ color: selected ? theme.colors.bg : theme.colors.fg, fontWeight: '600' }}
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
                    style={{ color: selected ? theme.colors.bg : theme.colors.fg, fontWeight: '600' }}
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
          <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
            TinyBooth runs fully on your device. No account, no network, nothing collected.
          </Text>
        </Section>
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
});
