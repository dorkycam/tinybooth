/**
 * Privacy screen.
 *
 * Refresh of the original `tinybooth-old/privacy-policy.md` content. The
 * standalone TinyBooth experience does not collect any personal information,
 * does not upload photos, and does not track usage. Photos stay on your
 * device unless you explicitly share them.
 */
import type { JSX } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/theme/useTheme';

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: 'What we collect when you use TinyBooth standalone',
    body: 'Nothing. Zero photos leave your device. We do not collect your name, email, location, or device identifiers. Camera access is requested so the app can take photos. The captured frames live in TinyBooth\u2019s sandbox until you save, share, print, or delete them.',
  },
  {
    title: 'When you connect to an event',
    body: 'Connecting an event is opt-in and only happens when you tap "Connect to event" in a future release. Until then, the app stays fully local. When you do connect, photos sync to the event owner\u2019s account and follow the retention rules of that event tier.',
  },
  {
    title: 'Crash and analytics data',
    body: 'No third-party analytics SDKs run in standalone mode. If you opt in to share crash reports through the system iOS / Android dialogs, those reports go to Apple or Google, not to us.',
  },
  {
    title: 'How long we keep your data',
    body: 'Standalone strips live on your device for as long as you keep them. We do not store any copies. If you delete the app, the strips inside the sandbox go with it.',
  },
  {
    title: 'Children',
    body: 'TinyBooth is rated 4+ and safe for all ages. Because we collect nothing, we do not knowingly collect data from children either.',
  },
  {
    title: 'Contact',
    body: 'Privacy questions go to dorkycam@gmail.com. We respond within seven days.',
  },
  {
    title: 'Updates to this policy',
    body: 'We post the current policy here. The "Last updated" date below changes when we change anything.',
  },
];

const LAST_UPDATED = '2026-04-26';

/** Privacy policy screen. */
export default function PrivacyScreen(): JSX.Element {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Privacy</Text>
        <Text style={[styles.meta, { color: theme.colors.subtle }]}>
          Last updated {LAST_UPDATED}
        </Text>
        {SECTIONS.map((section) => (
          <View
            key={section.title}
            style={[
              styles.section,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.fg }]}>{section.title}</Text>
            <Text style={[styles.body, { color: theme.colors.fg }]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 32, fontWeight: '700' },
  meta: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22 },
});
