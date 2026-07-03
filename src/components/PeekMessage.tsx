/**
 * Encouraging message overlay shown over the post-capture peek.
 *
 * The original PhotoBerry booth flashed a cheerful saying ("Cheese!", "Work
 * it!", and friends) on top of each just-captured shot. This restores that
 * beloved moment: a large, celebratory, centered message rendered over the
 * peek photo.
 *
 * Library-style: purely presentational. The parent owns the photo, decides
 * which message to show, and unmounts this overlay when the peek ends. The
 * message renders as a compact pill in the lower third so it celebrates the
 * shot without covering the subject's face.
 */
import type { JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';

/**
 * Fallback clearance above the bottom of the screen, in pixels, used when the
 * screen does not pass an exact value. Roughly clears the in-band counter pill.
 */
const DEFAULT_BOTTOM_CLEARANCE = 160;

interface PeekMessageProps {
  /** The encouraging message to celebrate the shot with. */
  message: string;
  /**
   * Space reserved at the bottom for the frame-counter pill, in pixels, so the
   * message never collides with it. Defaults to a value that clears the in-band
   * pill on the smallest phones.
   */
  bottomClearance?: number;
}

/**
 * Compact celebratory message pill shown in the lower third of the peek photo.
 *
 * @param props The message string and the bottom clearance to keep above the
 *   frame-counter pill.
 */
export function PeekMessage({
  message,
  bottomClearance = DEFAULT_BOTTOM_CLEARANCE,
}: PeekMessageProps): JSX.Element {
  const theme = useTheme('dark');
  return (
    <View pointerEvents="none" style={[styles.root, { paddingBottom: bottomClearance }]}>
      <View style={[styles.bubble, { backgroundColor: theme.colors.scrimStrong }]}>
        <Text
          style={[styles.text, { color: theme.colors.flash }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          accessibilityRole="text"
          accessibilityLabel={message}
        >
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Sit in the lower third, above the bottom frame-counter pill, so the
    // message never covers the subject's face. The bottom clearance that keeps
    // it clear of the pill comes from `bottomClearance` (the screen tracks the
    // pill's measured position).
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    maxWidth: '72%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    textAlign: 'center',
  },
});
