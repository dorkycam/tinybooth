/**
 * Standard large-title screen header.
 *
 * Renders a compact top row with a back control (the shared {@link IconButton},
 * chevron-back, ghost) on the left, the large screen title directly beneath it,
 * and an optional subtitle line. Safe-area aware so it sits below the status bar
 * and notch. Colors and spacing come from the theme.
 *
 * The host screen owns the back behavior and passes it as `onBack`; this header
 * does no navigation itself.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { IconButton } from './IconButton';

/** Props for {@link ScreenHeader}. */
export interface ScreenHeaderProps {
  /** Large title shown beneath the back row. */
  title: string;
  /** Optional helper line shown under the title. */
  subtitle?: string;
  /** Invoked when the back control is pressed. */
  onBack: () => void;
}

/**
 * A safe-area aware header with a back control above a left-aligned large title.
 *
 * @returns The rendered header.
 */
export function ScreenHeader({ title, subtitle, onBack }: ScreenHeaderProps): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing.sm,
          paddingHorizontal: theme.spacing.xl,
        },
      ]}
    >
      <View style={[styles.backRow, { marginLeft: -theme.spacing.sm }]}>
        <IconButton
          icon="chevron-back"
          accessibilityLabel="Go back"
          onPress={onBack}
          variant="ghost"
          size={44}
          testID="screen-header-back"
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.fg, marginTop: theme.spacing.sm }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[styles.subtitle, { color: theme.colors.subtle, marginTop: theme.spacing.xs }]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  backRow: {
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
});
