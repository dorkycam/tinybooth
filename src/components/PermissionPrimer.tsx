/**
 * Permission primer.
 *
 * A small in-app screen that explains why TinyBooth wants a permission BEFORE
 * the OS native alert is triggered. Apple's HIG and Google's policy both
 * recommend this two-step flow:
 *   1. App explains what + why.
 *   2. User taps Continue.
 *   3. App calls the OS permission API; OS shows its native alert.
 *
 * If the user previously denied + the OS won't re-prompt, render a "go to
 * Settings" CTA instead.
 */
import type { JSX } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { useTheme } from '../theme/useTheme';

interface PermissionPrimerProps {
  /** Headline shown at the top of the primer. */
  title: string;
  /** Body explaining what we use the permission for. Plain language. */
  body: string;
  /** Label on the primary CTA. Defaults to "Continue". */
  ctaLabel?: string;
  /** Called when the user taps the primary CTA. The caller then triggers the OS alert. */
  onContinue: () => void;
  /** Called when the user backs out. */
  onCancel: () => void;
  /** True when the OS will not re-prompt (user previously denied). */
  permanentlyDenied?: boolean;
}

/**
 * Renders the primer card. Force-dark to match the booth context.
 */
export function PermissionPrimer({
  title,
  body,
  ctaLabel = 'Continue',
  onContinue,
  onCancel,
  permanentlyDenied = false,
}: PermissionPrimerProps): JSX.Element {
  const theme = useTheme('dark');
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.fg }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.colors.subtle }]}>{body}</Text>
        <View style={styles.actions}>
          {permanentlyDenied ? (
            <PrimaryButton label="Open Settings" onPress={() => void Linking.openSettings()} />
          ) : (
            <PrimaryButton label={ctaLabel} onPress={onContinue} />
          )}
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            hitSlop={12}
            style={styles.skip}
          >
            <Text style={[styles.skipText, { color: theme.colors.subtle }]}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
