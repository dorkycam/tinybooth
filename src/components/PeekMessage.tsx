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
import { GlassSurface } from './GlassSurface';
import { useTheme } from '../theme/useTheme';

interface PeekMessageProps {
  /** The encouraging message to celebrate the shot with. */
  message: string;
}

/**
 * Compact celebratory message pill shown in the lower third of the peek photo.
 *
 * @param props The message string to display.
 */
export function PeekMessage({ message }: PeekMessageProps): JSX.Element {
  const theme = useTheme('dark');
  return (
    <View pointerEvents="none" style={styles.root}>
      <GlassSurface
        glassStyle="regular"
        colorScheme="dark"
        fallbackColor={theme.colors.scrimStrong}
        style={styles.scrim}
      >
        <Text
          style={[styles.text, { color: theme.colors.flash }]}
          numberOfLines={2}
          adjustsFontSizeToFit
          accessibilityRole="text"
          accessibilityLabel={message}
        >
          {message}
        </Text>
      </GlassSurface>
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
    // message never covers the subject's face.
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Fixed clearance above the bottom frame-counter pill (bottom:56, ~56px
    // tall) so the message never overlaps it, even on the smallest phones.
    paddingBottom: 160,
  },
  scrim: {
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
