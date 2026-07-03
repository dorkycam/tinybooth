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
import type { LayoutPreference } from '@/lib/layouts';
import { useTheme } from '@/theme/useTheme';

/** One selectable layout-preference option. */
export interface LayoutOption {
  /** The layout preference this pill selects. */
  key: LayoutPreference;
  /** Title shown on the pill. */
  label: string;
  /** One-line description under the title. */
  subtitle: string;
}

/** Built-in strip-layout options, in display order. */
const DEFAULT_LAYOUTS: readonly LayoutOption[] = [
  { key: 'classic', label: 'Classic', subtitle: '4 shots, two columns' },
  { key: 'quad', label: 'Quad', subtitle: '4 shots, 2x2 grid' },
];

interface LayoutPickerProps {
  /** Currently selected layout preference. */
  value: LayoutPreference;
  /** Fired with the tapped layout preference. */
  onChange: (next: LayoutPreference) => void;
  /** Selectable options, in display order. Defaults to the built-in Classic/Quad set. */
  options?: readonly LayoutOption[];
}

/**
 * Pill row of strip layout choices.
 *
 * @param props The selected layout, an `onChange` callback, and an optional
 *   `options` list to override the built-in Classic/Quad set.
 */
export function LayoutPicker({
  value,
  onChange,
  options = DEFAULT_LAYOUTS,
}: LayoutPickerProps): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {options.map((layout) => {
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
                { color: selected ? theme.colors.bg : theme.colors.fg },
              ]}
            >
              {layout.label}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: selected ? theme.colors.bg : theme.colors.subtle },
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
