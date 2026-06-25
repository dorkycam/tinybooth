/**
 * Screen flash overlay.
 *
 * A full-screen white sheet that fades in and out to light a guest's face at the
 * moment a shot is captured. Purely visual: the parent flips `active` true for
 * one capture and the overlay animates a quick flash, then calls `onDone` so the
 * parent can reset the trigger.
 *
 * Library-style: it owns no booth state. The parent decides when to flash and is
 * told when the flash finishes.
 */
import type { JSX } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface ScreenFlashProps {
  /** Flip true to play one flash. Reset to false in `onDone`. */
  active: boolean;
  /** Called once the flash animation finishes. */
  onDone: () => void;
}

/** Total flash duration in milliseconds (fade up + hold + fade down). */
const FLASH_MS = 320;

/**
 * Animated white flash over the camera preview.
 *
 * @param props Whether the flash is active plus the completion callback.
 */
export function ScreenFlash({ active, onDone }: ScreenFlashProps): JSX.Element | null {
  const theme = useTheme('dark');
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0.95,
        duration: FLASH_MS * 0.3,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FLASH_MS * 0.7,
        useNativeDriver: true,
      }),
    ]).start(() => onDone());
  }, [active, opacity, onDone]);

  if (!active) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.flash, { opacity, backgroundColor: theme.colors.flash }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
});
