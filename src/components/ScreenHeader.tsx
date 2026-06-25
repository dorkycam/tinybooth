/**
 * Standard centered navigation bar.
 *
 * Renders a single safe-area-aware top bar: a back control (the shared
 * {@link IconButton}, chevron-back, ghost) pinned to the left, with the title
 * horizontally centered relative to the full bar width and an optional subtitle
 * centered directly beneath it. The back button is absolutely positioned so the
 * title stays centered regardless of its presence. Safe-area aware so it sits
 * below the status bar and notch. Colors and spacing come from the theme.
 *
 * The host screen owns the back behavior and passes it as `onBack`; this header
 * does no navigation itself.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';
import { IconButton } from './IconButton';

/** Diameter of the back control, also reserved as side padding for the title. */
const BACK_SIZE = 40;

/** Props for {@link ScreenHeader}. */
export interface ScreenHeaderProps {
  /** Title shown centered in the bar. */
  title: string;
  /** Optional helper line shown centered under the title. */
  subtitle?: string;
  /** Invoked when the back control is pressed. */
  onBack: () => void;
}

/**
 * A safe-area aware nav bar with a left back control and a centered title.
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
          paddingBottom: theme.spacing.sm,
          paddingHorizontal: theme.spacing.xl,
        },
      ]}
    >
      <View style={styles.bar}>
        <View style={styles.backSlot}>
          <IconButton
            icon="chevron-back"
            accessibilityLabel="Go back"
            onPress={onBack}
            variant="ghost"
            size={BACK_SIZE}
            testID="screen-header-back"
          />
        </View>
        <View style={[styles.titleWrap, { paddingHorizontal: BACK_SIZE }]} pointerEvents="none">
          <Text style={[styles.title, { color: theme.colors.fg }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: theme.colors.subtle, marginTop: theme.spacing.xs }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
  },
  bar: {
    minHeight: BACK_SIZE,
    justifyContent: 'center',
  },
  backSlot: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
