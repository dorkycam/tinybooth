/**
 * Outlined secondary button. Pairs with `PrimaryButton` for the redo / share
 * actions on the preview screen.
 */
import type { JSX } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';
import { buttonHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/** Props for {@link SecondaryButton}. */
export interface SecondaryButtonProps extends Pick<PressableProps, 'testID'> {
  /** Button caption. */
  label: string;
  /** Tap handler. */
  onPress: () => void;
  /** Disable interaction and dim the control. */
  disabled?: boolean;
  /** Optional style appended to the pill (after the base styles). */
  style?: StyleProp<ViewStyle>;
}

/** Outlined secondary action. */
export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  testID,
  style,
}: SecondaryButtonProps): JSX.Element {
  const theme = useTheme();
  const handlePress = (): void => {
    void buttonHaptic();
    onPress();
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={handlePress}
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
        style,
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
