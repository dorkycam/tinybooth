/**
 * WhatsNewModal.
 *
 * First-launch-of-this-version modal that explains what's new and explicitly
 * reassures existing users (per docs/plan.md section 5.1):
 *   "still free, still no account required, your random messages are still here"
 *
 * Composition:
 *   - Library-style component. Receives `visible` + `onDismiss` from the
 *     parent so it can be tested in isolation and reused for an in-app
 *     "what's new" link from Settings later.
 *   - `version` is a label the parent passes in for the heading.
 *
 * Persistence (one-shot per version) is handled in the parent screen via
 * `src/lib/whatsNew.ts`. The modal itself never touches AsyncStorage.
 */
import type { JSX } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '../theme/useTheme';

interface WhatsNewModalProps {
  /** Whether to render the modal. */
  visible: boolean;
  /** App version label, surfaced in the title (e.g. "1.0"). */
  version: string;
  /** Called when the user taps "Got it" or the backdrop. */
  onDismiss: () => void;
  /** Optional testID forwarded to the root Pressable for screenshot tests. */
  testID?: string;
}

const WHATS_NEW_BULLETS: ReadonlyArray<string> = [
  'Now on Android. Same brand, same vibe.',
  'More layouts: 2x2, 1x3, single, plus the original 1x4.',
  'Photo wall for guests. They scan a QR and upload from any phone, no app needed.',
  'Optional event branding for paying hosts: drop a logo, pick a color.',
  'IG-format share so people can post the strip to Stories.',
];

const STILL_HERE_BULLETS: ReadonlyArray<string> = [
  'Still free for personal use.',
  'Still no account required.',
  'Your random messages from the original app are still here.',
];

/**
 * Modal that explains what changed in this app version.
 *
 * @param props.visible - whether to render the modal.
 * @param props.version - human-readable version string.
 * @param props.onDismiss - dismissal callback.
 */
export function WhatsNewModal({
  visible,
  version,
  onDismiss,
  testID,
}: WhatsNewModalProps): JSX.Element {
  const theme = useTheme();
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onDismiss}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss what's new"
        onPress={onDismiss}
        style={styles.backdrop}
        testID={testID}
      >
        <Pressable
          accessibilityRole="none"
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
          ]}
        >
          <Text style={[styles.eyebrow, { color: theme.colors.subtle }]}>
            What's new in {version}
          </Text>
          <Text style={[styles.title, { color: theme.colors.fg }]}>
            More booth, more wall, still free.
          </Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.section, { color: theme.colors.fg }]}>What's new</Text>
            {WHATS_NEW_BULLETS.map((line) => (
              <BulletRow key={line} line={line} accent={theme.colors.primary} fg={theme.colors.fg} />
            ))}
            <Text style={[styles.section, { color: theme.colors.fg, marginTop: 16 }]}>
              Still here
            </Text>
            {STILL_HERE_BULLETS.map((line) => (
              <BulletRow key={line} line={line} accent={theme.colors.primary} fg={theme.colors.fg} />
            ))}
          </ScrollView>
          <PrimaryButton
            label="Got it"
            onPress={onDismiss}
            testID="whats-new-dismiss"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface BulletRowProps {
  line: string;
  accent: string;
  fg: string;
}

function BulletRow({ line, accent, fg }: BulletRowProps): JSX.Element {
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletDot, { backgroundColor: accent }]} />
      <Text style={[styles.bulletText, { color: fg }]}>{line}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 8,
  },
  section: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
});
