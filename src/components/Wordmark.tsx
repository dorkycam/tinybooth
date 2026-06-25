/**
 * Lowercase TinyBooth wordmark. One source of truth so screen headers and
 * splash text never drift from the brand identity.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/** Wordmark size variants. */
export type WordmarkSize = 'sm' | 'md' | 'lg';

interface WordmarkProps {
  size?: WordmarkSize;
  style?: TextStyle;
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
