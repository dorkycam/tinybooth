/**
 * Settings section.
 *
 * A titled card that groups related settings rows. Library-style: it takes a
 * title and children and pulls its own colors from the theme, so the Settings
 * screen does not repeat the card styling per section.
 */
import type { JSX, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface SettingsSectionProps {
  /** Uppercase label shown above the grouped rows. */
  title: string;
  /** The rows inside the card. */
  children: ReactNode;
}

/**
 * Titled settings card.
 *
 * @param props The section title and its child rows.
 */
export function SettingsSection({ title, children }: SettingsSectionProps): JSX.Element {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: theme.colors.subtle }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
