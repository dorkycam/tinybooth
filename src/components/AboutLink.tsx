/**
 * About link.
 *
 * A tappable text row used in the Settings About section for the repo, issues,
 * privacy, and terms links. Library-style: it takes a label and an `onPress`
 * callback, so the screen owns where each link goes.
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
import { useTheme } from '@/theme/useTheme';

/** Props for {@link AboutLink}. */
export interface AboutLinkProps extends Pick<PressableProps, 'testID'> {
  /** The link text. */
  label: string;
  /** Fired when the row is tapped. */
  onPress: () => void;
  /** Optional style appended to the row (after the base styles). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A single tappable About link.
 *
 * @param props The link label and its press handler.
 */
export function AboutLink({ label, onPress, testID, style }: AboutLinkProps): JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      hitSlop={8}
      testID={testID}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }, style]}
    >
      <Text style={[styles.label, { color: theme.colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
