/**
 * Segmented choice row.
 *
 * A row of pill chips where exactly one is selected. Used in Settings for the
 * countdown length, the appearance mode, and the QA preview-class override, so
 * the chip styling lives in one place instead of being copied per section.
 *
 * Library-style: it takes the option list, the selected value, a label renderer,
 * and an `onSelect` callback. It is generic over the option type.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SegmentedChoiceProps<T extends string | number> {
  /** Selectable options, in display order. */
  options: readonly T[];
  /** Currently selected option. */
  value: T;
  /** Render the label for an option. Defaults to `String(option)`. */
  renderLabel?: (option: T) => string;
  /** Fired with the tapped option. */
  onSelect: (option: T) => void;
}

/**
 * Single-select pill row.
 *
 * @param props Options, selected value, optional label renderer, and callback.
 */
export function SegmentedChoice<T extends string | number>({
  options,
  value,
  renderLabel,
  onSelect,
}: SegmentedChoiceProps<T>): JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option === value;
        return (
          <Pressable
            key={String(option)}
            onPress={() => onSelect(option)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderColor: selected ? theme.colors.primary : theme.colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? theme.colors.bg : theme.colors.fg },
              ]}
            >
              {renderLabel ? renderLabel(option) : String(option)}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
  },
});
