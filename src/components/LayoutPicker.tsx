/**
 * Strip-layout picker. Renders a row of pill buttons; tapping one calls
 * `onChange` and persists the selection in `sessionSettings`.
 *
 * Lives inline rather than in a bottom sheet for Phase 2 to keep the screen
 * count low. A real bottom sheet swap is a one-line wrap when we add a sheet
 * primitive in Phase 3.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StripLayout } from '@tinybooth/api-types';
import { useTheme } from '../theme/useTheme';

const LAYOUTS: Array<{ key: StripLayout; label: string; subtitle: string }> = [
  { key: '1x4_classic', label: '1x4', subtitle: 'classic strip' },
  { key: '2x2', label: '2x2', subtitle: 'square grid' },
  { key: '1x3', label: '1x3', subtitle: 'tall strip' },
  { key: 'single', label: '1', subtitle: 'postcard' },
  { key: '1x6_double', label: '1x6', subtitle: 'long strip' },
];

interface LayoutPickerProps {
  value: StripLayout;
  onChange: (next: StripLayout) => void;
}

/** Pill row of strip layout choices. */
export function LayoutPicker({ value, onChange }: LayoutPickerProps): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {LAYOUTS.map((layout) => {
        const selected = layout.key === value;
        return (
          <Pressable
            key={layout.key}
            onPress={() => onChange(layout.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderColor: selected ? theme.colors.primary : theme.colors.hairline,
                opacity: pressed ? 0.85 : 1,
                borderRadius: theme.radius.lg,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? '#FFFFFF' : theme.colors.fg },
              ]}
            >
              {layout.label}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: selected ? '#FFFFFFAA' : theme.colors.subtle },
              ]}
            >
              {layout.subtitle}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});
