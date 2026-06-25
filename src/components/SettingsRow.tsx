/**
 * Settings row.
 *
 * One labeled control inside a settings section. By default the label and the
 * control sit on one line (for switches); pass `stacked` to put the control on
 * its own line below the label (for segmented choices and pickers). Keeps the
 * row layout in one place instead of repeating it per setting.
 */
import type { JSX, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SettingsRowProps {
  /** The setting's label. */
  title: string;
  /** When true, the control renders on its own line below the label. */
  stacked?: boolean;
  /** The control (a Switch, SegmentedChoice, picker, etc). */
  children: ReactNode;
}

/**
 * A labeled settings control.
 *
 * @param props The label, an optional stacked flag, and the control.
 */
export function SettingsRow({ title, stacked = false, children }: SettingsRowProps): JSX.Element {
  const theme = useTheme();
  return (
    <View style={stacked ? styles.stacked : styles.row}>
      <Text style={[styles.title, { color: theme.colors.fg }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  stacked: {
    gap: 8,
  },
  title: {
    fontSize: 17,
    flex: 1,
  },
});
