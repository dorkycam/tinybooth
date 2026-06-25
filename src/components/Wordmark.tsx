/**
 * Lowercase TinyBooth wordmark. One source of truth so screen headers and
 * splash text never drift from the brand identity.
 */
import type { JSX } from 'react';
import { type StyleProp, StyleSheet, Text, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/** Wordmark size variants. */
export type WordmarkSize = 'sm' | 'md' | 'lg';

/** Props for {@link Wordmark}. */
export interface WordmarkProps {
  /** Type scale of the wordmark. Defaults to `md`. */
  size?: WordmarkSize;
  /** Optional style appended to the text (after the base styles). */
  style?: StyleProp<TextStyle>;
}

/** Render the brand wordmark. */
export function Wordmark({ size = 'md', style }: WordmarkProps): JSX.Element {
  const theme = useTheme();
  const fontSize = size === 'lg' ? 48 : size === 'sm' ? 22 : 32;
  return (
    <Text
      style={[
        styles.text,
        {
          color: theme.colors.fg,
          fontSize,
          letterSpacing: -1.5,
        },
        style,
      ]}
    >
      tinybooth
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '700',
  },
});
