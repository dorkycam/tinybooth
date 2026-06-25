/**
 * Round icon button used across the booth for navigation (back / close) and for
 * the preview delivery actions (print / save / share / redo). Pass a `label` to
 * render a caption under the circle; omit it for a bare icon button.
 *
 * Set `glass` to render the circle as Liquid Glass (iOS 26+) for controls that
 * float over the camera or a photo; it falls back to the solid `neutral`
 * surface where glass is unavailable. The `primary` variant stays a solid brand
 * fill so the main action keeps its color.
 *
 * Icons come from `@expo/vector-icons` Ionicons. Colors come from the theme so
 * nothing is hardcoded.
 */
import type { JSX } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { GLASS_AVAILABLE, GlassSurface } from './GlassSurface';
import { buttonHaptic } from '@/lib/haptics';
import { useTheme } from '@/theme/useTheme';

/** Visual tone of an {@link IconButton}. */
export type IconButtonVariant = 'primary' | 'neutral' | 'ghost';

/** Props for {@link IconButton}. */
export interface IconButtonProps extends Pick<PressableProps, 'testID'> {
  /** Ionicons glyph name, e.g. `chevron-back`, `print`, `share-outline`. */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Required for screen readers (the visible label, if any, may differ). */
  accessibilityLabel: string;
  /** Tap handler. */
  onPress: () => void;
  /** Optional caption rendered under the circle. */
  label?: string;
  /** Color treatment. Defaults to `neutral`. */
  variant?: IconButtonVariant;
  /** Render the circle as Liquid Glass (iOS 26+) for controls over content. */
  glass?: boolean;
  /** Circle diameter in px. Defaults to 56. */
  size?: number;
  /** Disable interaction and dim the control. */
  disabled?: boolean;
  /** Optional style appended to the outer wrapper (after the base styles). */
  style?: StyleProp<ViewStyle>;
}

/**
 * A circular icon button with an optional caption.
 *
 * @returns The rendered control.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  label,
  variant = 'neutral',
  glass = false,
  size = 56,
  disabled = false,
  testID,
  style,
}: IconButtonProps): JSX.Element {
  const theme = useTheme();
  // Glass only applies to non-primary controls; primary keeps its brand fill.
  const useGlass = glass && variant !== 'primary' && GLASS_AVAILABLE;

  const background =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'ghost'
        ? 'transparent'
        : theme.colors.surface;
  const iconColor =
    variant === 'primary' ? theme.colors.bg : useGlass ? theme.colors.flash : theme.colors.fg;
  const borderColor = variant === 'ghost' && !useGlass ? theme.colors.hairline : 'transparent';

  const glyph = <Ionicons name={icon} size={Math.round(size * 0.44)} color={iconColor} />;

  const handlePress = (): void => {
    void buttonHaptic();
    onPress();
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePress}
        testID={testID}
        style={({ pressed }) => [
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: useGlass ? 'transparent' : background,
            borderColor,
            borderWidth: borderColor === 'transparent' ? 0 : 1,
            opacity: pressed ? 0.7 : disabled ? 0.4 : 1,
          },
        ]}
      >
        {useGlass ? (
          <GlassSurface
            interactive
            glassStyle="regular"
            fallbackColor={theme.colors.surface}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            {glyph}
          </GlassSurface>
        ) : (
          glyph
        )}
      </Pressable>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.subtle }]} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
