/**
 * Help screen.
 *
 * Two sections:
 * 1. Original Swift help content (the GitHub link from `HelpViewController`).
 * 2. New "How to set up at an event" section with the Guided Access steps
 *    pulled from `docs/research/users.md`.
 */
import type { JSX } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/theme/useTheme';

const GITHUB_URL = 'https://github.com/tinybooth/tinybooth';

const SETUP_STEPS = [
  'Pick a tablet (an iPad on a tall light stand is the gold standard) and plug it into power. Disable auto-lock so the screen stays awake.',
  'Open the Settings app, tap Accessibility > Guided Access, flip it on, and pick a passcode you will remember.',
  'Open TinyBooth, triple-click the side button to start a Guided Access session, then hand the tablet to your guests.',
  'Place the tablet in portrait, near a power outlet, with a ring light or a lamp aimed at the photo zone.',
  'If you have a Canon Selphy CP1300 or CP1500, connect it to the same Wi-Fi as the tablet. AirPrint will pick it up automatically.',
  'Assign someone to walk by every 30 minutes to top up paper and ink.',
];

/** Help and event setup screen. */
export default function HelpScreen(): JSX.Element {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Wordmark size="md" />
        <Text style={[styles.title, { color: theme.colors.fg }]}>Help</Text>
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.subtle }]}>About TinyBooth</Text>
          <Text style={[styles.body, { color: theme.colors.fg }]}>
            Take a photo. Get a strip. That's the whole app.
          </Text>
          <Text
            style={[styles.link, { color: theme.colors.primary }]}
            onPress={() => Linking.openURL(GITHUB_URL)}
            accessibilityRole="link"
          >
            Visit the GitHub to file feedback
          </Text>
        </View>
        <View
          style={[
            styles.section,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.subtle }]}>
            How to set up at an event
          </Text>
          {SETUP_STEPS.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <Text style={[styles.stepNum, { color: theme.colors.primary }]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text style={[styles.stepBody, { color: theme.colors.fg }]}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, gap: 16 },
  title: { fontSize: 32, fontWeight: '700' },
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
  body: { fontSize: 17 },
  link: { fontSize: 17, fontWeight: '600' },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepNum: { fontSize: 17, fontWeight: '700', width: 28 },
  stepBody: { flex: 1, fontSize: 15, lineHeight: 22 },
});
