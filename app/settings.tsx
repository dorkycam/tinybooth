/**
 * Settings screen.
 *
 * Capture defaults (flash, countdown length, sound, haptics, default layout,
 * save individual frames), idle reset time, appearance (system / light / dark),
 * and an About section (version, MIT license, repo and legal links). Everything
 * persists locally via the shared settings store; the app has no account and
 * collects nothing.
 *
 * Thin screen: the section, row, and about-link pieces are extracted components.
 */
import type { JSX } from 'react';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AboutLink } from '@/components/AboutLink';
import { ContentColumn } from '@/components/ContentColumn';
import { LayoutPicker } from '@/components/LayoutPicker';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedChoice } from '@/components/SegmentedChoice';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { Wordmark } from '@/components/Wordmark';
import { useSettings } from '@/hooks/useSettings';
import { usePresentation } from '@/lib/PresentationContext';
import {
  GITHUB_ISSUES_URL,
  GITHUB_REPO_URL,
  PRIVACY_URL,
  TERMS_URL,
} from '@/lib/links';
import {
  COUNTDOWN_CHOICES,
  IDLE_RESET_CHOICES,
  type IdleReset,
} from '@/lib/sessionSettings';
import { useThemePreference, type ThemePreference } from '@/theme/ThemeContext';
import { SPACING } from '@/theme/tokens/spacing';
import { useTheme } from '@/theme/useTheme';

const THEME_CHOICES: ThemePreference[] = ['system', 'light', 'dark'];

/** Label an idle-reset choice for its chip. */
function idleResetLabel(value: IdleReset): string {
  return value === 'never' ? 'Never' : `${value}s`;
}

/** Open an external URL, ignoring failures (no browser is non-fatal here). */
function openLink(url: string): void {
  void Linking.openURL(url).catch(() => undefined);
}

/** Settings screen. */
export default function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const themePref = useThemePreference();
  const router = useRouter();
  const { presentation } = usePresentation();
  const { settings, update } = useSettings();
  // Read the real installed version + build number from the native binary so it
  // always matches the actual iOS build number / Android version code without
  // hardcoding (EAS manages the build number remotely). Falls back to the JS
  // config version where the native value is unavailable (e.g. tests).
  const version = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0';
  const build = Application.nativeBuildVersion;
  const versionLabel = build ? `Version ${version} (${build})` : `Version ${version}`;

  // Always give the guest a way out of Settings. Fall back to Start when there
  // is no screen to go back to (e.g. opened as the first route in dev).
  function handleClose(): void {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      <ScreenHeader title="Settings" onBack={handleClose} />
      <ScrollView contentContainerStyle={styles.content}>
        <ContentColumn
          presentation={presentation}
          maxWidth={{ stacked: 520, wide: 640 }}
          style={styles.column}
        >
          <Wordmark size="md" />

          <SettingsSection title="Capture defaults">
          <SettingsRow title="Flash on by default">
            <Switch value={settings.flash} onValueChange={(value) => update({ flash: value })} />
          </SettingsRow>
          <SettingsRow title="Countdown sound">
            <Switch value={settings.sound} onValueChange={(value) => update({ sound: value })} />
          </SettingsRow>
          <SettingsRow title="Haptics">
            <Switch
              value={settings.haptics}
              onValueChange={(value) => update({ haptics: value })}
            />
          </SettingsRow>
          <SettingsRow title="Countdown length" stacked>
            <SegmentedChoice
              options={COUNTDOWN_CHOICES}
              value={settings.countdown}
              renderLabel={(seconds) => `${seconds}s`}
              onSelect={(countdown) => update({ countdown })}
            />
          </SettingsRow>
          <SettingsRow title="Default layout" stacked>
            <LayoutPicker value={settings.layout} onChange={(layout) => update({ layout })} />
          </SettingsRow>
          <SettingsRow title="Save individual frames">
            <Switch
              value={settings.saveFrames}
              onValueChange={(value) => update({ saveFrames: value })}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Kiosk">
          <SettingsRow title="Return to Start after idle" stacked>
            <SegmentedChoice
              options={IDLE_RESET_CHOICES}
              value={settings.idleReset}
              renderLabel={idleResetLabel}
              onSelect={(idleReset) => update({ idleReset })}
            />
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SegmentedChoice
            options={THEME_CHOICES}
            value={themePref.preference}
            onSelect={(choice) => void themePref.setPreference(choice)}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
            {versionLabel}
          </Text>
          <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
            TinyBooth runs fully on your device. No account, no network, nothing collected.
          </Text>
          <Text style={[styles.aboutLine, { color: theme.colors.subtle }]}>
            Free and open source under the MIT license.
          </Text>
          <View style={styles.links}>
            <AboutLink label="GitHub repository" onPress={() => openLink(GITHUB_REPO_URL)} />
            <AboutLink label="Report a problem" onPress={() => openLink(GITHUB_ISSUES_URL)} />
            <AboutLink label="Privacy Policy" onPress={() => openLink(PRIVACY_URL)} />
            <AboutLink label="Terms" onPress={() => openLink(TERMS_URL)} />
          </View>
        </SettingsSection>
        </ContentColumn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingTop: SPACING.sm, paddingBottom: SPACING.xl3 },
  column: { paddingHorizontal: SPACING.xl, gap: SPACING.lg },
  aboutLine: {
    fontSize: 15,
  },
  links: {
    marginTop: 4,
    gap: 4,
  },
});
