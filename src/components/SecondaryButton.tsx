/**
 * Outlined secondary button. Pairs with `PrimaryButton` for the redo / share
 * actions on the preview screen.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

/** Outlined secondary action. */
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  testID,
}: SecondaryButtonProps): JSX.Element {
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
          borderColor: theme.colors.fg,
          opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
        },
      ]}
    >
      <Text style={[styles.label, { color: theme.colors.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
});
