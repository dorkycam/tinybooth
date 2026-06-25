/**
 * Layout choice card.
 *
 * A large tappable card shown on the Choose layout screen. It renders a small
 * geometric preview of how the shots are arranged (a single column of stacked
 * frames for Classic, a 2x2 grid for Quad) plus the label and a one-line
 * description.
 *
 * Library-style: it takes the layout id, its copy, and an `onPress` callback. It
 * does not navigate or read settings itself.
 */
import type { JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StripLayout } from '@/lib/layouts';
import { useTheme } from '@/theme/useTheme';

interface LayoutChoiceCardProps {
  /** Which layout this card selects. */
  layout: StripLayout;
  /** Card title, e.g. "Classic strip". */
  label: string;
  /** One-line description under the title. */
  description: string;
  /** Fired when the guest taps the card. */
  onPress: (layout: StripLayout) => void;
}

/**
 * One selectable layout card with a tiny arrangement preview.
 *
 * @param props Layout id, copy, and the press callback.
 */
export function LayoutChoiceCard({
  layout,
  label,
  description,
  onPress,
}: LayoutChoiceCardProps): JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onPress(layout)}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.hairline,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.preview,
          { backgroundColor: theme.colors.bg, borderColor: theme.colors.hairline },
        ]}
      >
        {layout === 'classic' ? (
          <ClassicGlyph color={theme.colors.primary} />
        ) : (
          <QuadGlyph color={theme.colors.primary} />
        )}
      </View>
      <Text style={[styles.label, { color: theme.colors.fg }]}>{label}</Text>
      <Text style={[styles.description, { color: theme.colors.subtle }]}>{description}</Text>
    </Pressable>
  );
}

/** Props for the layout preview glyphs. */
interface LayoutGlyphProps {
  /** Fill color for the preview cells. */
  color: string;
}

/** Stacked-column glyph for the Classic strip. */
function ClassicGlyph({ color }: LayoutGlyphProps): JSX.Element {
  return (
    <View style={styles.classicColumn}>
      {[0, 1, 2, 3].map((cell) => (
        <View key={cell} style={[styles.classicCell, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

/** 2x2 grid glyph for the Quad layout. */
function QuadGlyph({ color }: LayoutGlyphProps): JSX.Element {
  return (
    <View style={styles.quadGrid}>
      {[0, 1, 2, 3].map((cell) => (
        <View key={cell} style={[styles.quadCell, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    width: 96,
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  classicColumn: {
    flex: 1,
    width: 44,
    gap: 6,
    justifyContent: 'center',
  },
  classicCell: {
    height: 18,
    borderRadius: 3,
  },
  quadGrid: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignContent: 'center',
    justifyContent: 'center',
  },
  quadCell: {
    width: '44%',
    height: 44,
    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
  },
});
