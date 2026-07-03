/**
 * Screen flash overlay.
 *
 * A full-screen white sheet that acts as fill light on devices without a real
 * camera flash. Unlike a quick feedback pop, this is a held light: the parent
 * flips `active` true and the overlay ramps to full opacity and stays there
 * through the exposure, then the parent flips `active` false and the overlay
 * fades out and calls `onDone`. Holding at full opacity across `takePhoto()` is
 * what makes it actually brighten the guest's face instead of racing the shutter.
 *
 * Library-style: it owns no booth state. The parent decides when the light is on
 * and is told when the fade-out finishes.
 */
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface ScreenFlashProps {
  /** True holds the fill light on; flip false after the shot to fade it out. */
  active: boolean;
  /** Called once the fade-out finishes. */
  onDone: () => void;
}

/** Ramp-up duration to reach full opacity before the exposure, in milliseconds. */
const FLASH_RAMP_MS = 80;
/** Fade-out duration after the shot resolves, in milliseconds. */
const FLASH_FADE_MS = 220;

/**
 * Held white fill light over the camera preview.
 *
 * @param props Whether the light is currently on plus the fade-out callback.
 */
export function ScreenFlash({ active, onDone }: ScreenFlashProps): JSX.Element | null {
  const theme = useTheme('dark');
  const opacity = useRef(new Animated.Value(0)).current;
  const wasActive = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (active) {
      wasActive.current = true;
      setMounted(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: FLASH_RAMP_MS,
        useNativeDriver: true,
      }).start();
    } else if (wasActive.current) {
      wasActive.current = false;
      Animated.timing(opacity, {
        toValue: 0,
        duration: FLASH_FADE_MS,
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        onDone();
      });
    }
  }, [active, opacity, onDone]);

  if (!mounted) return null;

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
