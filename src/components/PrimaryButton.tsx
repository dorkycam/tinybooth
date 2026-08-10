/**
 * Coral pill button used for primary actions (Start, Print, Save).
 *
 * Stays consistent across screens so the QA pass does not have to chase down
 * one-off styles. Disabled state desaturates to graphite.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

/** Brand-coral pill button. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: PrimaryButtonProps): JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: disabled ? theme.colors.subtle : theme.colors.primary,
          opacity: pressed ? 0.85 : 1,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
});
