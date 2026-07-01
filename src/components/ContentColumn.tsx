/**
 * Centered, max-width content column.
 *
 * A full-width `View` that centers itself and caps its width based on the active
 * {@link Presentation}. This is the single primitive that makes `stacked` and
 * `wide` presentations differ only by content width, never by a fixed pixel
 * width. It bakes in no padding; callers supply their own spacing via `style`.
 */
import type { JSX, ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { CONTENT_MAX_WIDTH, type Presentation } from '@/lib/layout';

/** Per-presentation max width in DP. */
interface MaxWidthByPresentation {
  /** Cap for the stacked presentation. */
  stacked: number;
  /** Cap for the wide presentation. */
  wide: number;
}

/** Props for {@link ContentColumn}. */
interface ContentColumnProps {
  /** Active presentation, selecting which max width applies. */
  presentation: Presentation;
  /** Optional per-presentation max-width override. Defaults to {@link CONTENT_MAX_WIDTH}. */
  maxWidth?: MaxWidthByPresentation;
  /** Column contents. */
  children: ReactNode;
  /** Optional style appended after the base column styles. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders a centered column that caps its width per presentation.
 *
 * @param props Presentation, optional width overrides, children, and style.
 * @returns The column element.
 */
export function ContentColumn({
  presentation,
  maxWidth = CONTENT_MAX_WIDTH,
  children,
  style,
}: ContentColumnProps): JSX.Element {
  return (
    <View style={[styles.column, { maxWidth: maxWidth[presentation] }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: '100%',
    alignSelf: 'center',
  },
});
