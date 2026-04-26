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
import Constants from 'expo-constants';
import { Link } from 'expo-router';
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
import { useTheme } from '@/theme/useTheme';

const PREVIEW_CHOICES: PreviewClassOverride[] = ['auto', 'phone', 'tablet'];

/** Settings tab. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
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
                      backgroundColor: selected ? theme.colors.coral : theme.colors.surface,
                      borderColor: selected ? theme.colors.coral : theme.colors.hairline,
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
          <Link href="/(tabs)/help" style={[styles.link, { color: theme.colors.coral }]}>
            Help and event setup
          </Link>
          <Link href="/(tabs)/privacy" style={[styles.link, { color: theme.colors.coral }]}>
            Privacy
          </Link>
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
  link: {
    fontSize: 17,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
