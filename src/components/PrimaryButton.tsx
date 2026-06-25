/**
 * Mint pill button used for primary actions (Start, Print, Save).
 *
 * Stays consistent across screens so the QA pass does not have to chase down
 * one-off styles. Disabled state desaturates to graphite. The label uses a dark
 * carbon token because the mint `primary` fill is light in both themes.
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
import { ON_BRAND_FILL_TEXT } from '@/theme/tokens/colors';
import { useTheme } from '@/theme/useTheme';

/** Props for {@link PrimaryButton}. */
export interface PrimaryButtonProps extends Pick<PressableProps, 'testID'> {
  /** Button caption. */
  label: string;
  /** Tap handler. */
  onPress: () => void;
  /** Disable interaction and desaturate the fill. */
  disabled?: boolean;
  /** Optional style appended to the pill (after the base styles). */
  style?: StyleProp<ViewStyle>;
}

/** Brand-mint pill button. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  testID,
  style,
}: PrimaryButtonProps): JSX.Element {
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
          backgroundColor: disabled ? theme.colors.subtle : theme.colors.primary,
          opacity: pressed ? 0.85 : 1,
          borderRadius: theme.radius.pill,
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.md,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: ON_BRAND_FILL_TEXT }]}>{label}</Text>
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
