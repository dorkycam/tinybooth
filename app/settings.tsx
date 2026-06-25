/**
 * Settings screen.
 *
 * Capture defaults (flash, countdown length, sound, haptics, default layout,
 * save individual frames), appearance (system / light / dark), a QA preview-class
 * override, and an About section with the app version. Everything persists
 * locally via AsyncStorage; the app has no account and collects nothing.
 */
import type { JSX } from 'react';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutPicker } from '@/components/LayoutPicker';
import { SegmentedChoice } from '@/components/SegmentedChoice';
import { Wordmark } from '@/components/Wordmark';
import {
  COUNTDOWN_CHOICES,
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
    setSettings((current) => ({ ...current, ...patch }));
    void saveSessionSettings(patch);
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Settings</Text>

        <Section title="Capture defaults" theme={theme}>
          <Row title="Flash on by default" theme={theme}>
            <Switch value={settings.flash} onValueChange={(value) => update({ flash: value })} />
          </Row>
          <Row title="Countdown sound" theme={theme}>
            <Switch value={settings.sound} onValueChange={(value) => update({ sound: value })} />
          </Row>
          <Row title="Haptics" theme={theme}>
            <Switch
              value={settings.haptics}
              onValueChange={(value) => update({ haptics: value })}
            />
          </Row>
          <Stacked title="Countdown length" theme={theme}>
            <SegmentedChoice
              options={COUNTDOWN_CHOICES}
              value={settings.countdown}
              renderLabel={(seconds) => `${seconds}s`}
              onSelect={(countdown) => update({ countdown })}
            />
          </Stacked>
          <Stacked title="Default layout" theme={theme}>
            <LayoutPicker value={settings.layout} onChange={(layout) => update({ layout })} />
          </Stacked>
          <Row title="Save individual frames" theme={theme}>
            <Switch
              value={settings.saveFrames}
              onValueChange={(value) => update({ saveFrames: value })}
            />
          </Row>
        </Section>

        <Section title="Appearance" theme={theme}>
          <SegmentedChoice
            options={THEME_CHOICES}
            value={themePref.preference}
            onSelect={(choice) => void themePref.setPreference(choice)}
          />
        </Section>

        <Section title="QA preview" theme={theme}>
          <SegmentedChoice
            options={PREVIEW_CHOICES}
            value={settings.previewClass}
            onSelect={(previewClass) => update({ previewClass })}
          />
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

interface StackedProps {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}

function Stacked({ title, theme, children }: StackedProps): JSX.Element {
  return (
    <View style={styles.stacked}>
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
  stacked: {
    gap: 8,
  },
  rowTitle: {
    fontSize: 17,
    flex: 1,
  },
  aboutLine: {
    fontSize: 15,
  },
});
