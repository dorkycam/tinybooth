/**
 * Presentation scaffold shared by every guest screen.
 *
 * Lays out the fixed regions that are identical across presentations: a centered
 * content column (via {@link ContentColumn}), a single lower-center reachable
 * action band, and the two nav-chrome corner slots (Back top-left, Close
 * top-right). The `stacked` and `wide` presentations differ ONLY by the content
 * column max width and a little horizontal breathing room; the action band and
 * corner slots never move between them.
 *
 * All safe-area math is explicit here (the root opts out of automatic insets via
 * `edges={[]}`) so corners sit at `insets + SPACING` and the action band's
 * padding is anchored above the bottom inset without any double counting. This
 * does NOT replace {@link ScreenHeader}; a screen may still render a header
 * inside `children`.
 */
import type { JSX, ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH, type Presentation } from '@/lib/layout';
import { SPACING } from '@/theme/tokens/spacing';
import { useTheme } from '@/theme/useTheme';
import { ContentColumn } from './ContentColumn';

/** Per-presentation max width in DP. */
interface MaxWidthByPresentation {
  /** Cap for the stacked presentation. */
  stacked: number;
  /** Cap for the wide presentation. */
  wide: number;
}

/** Props for {@link ScreenScaffold}. */
interface ScreenScaffoldProps {
  /** Active presentation, selecting content width and spacing. */
  presentation: Presentation;
  /** Centered content (top/middle of the screen). */
  children: ReactNode;
  /** Primary guest actions, pinned in the lower-center reachable band. */
  actionBand?: ReactNode;
  /** Top-left nav chrome (typically Back). */
  topLeft?: ReactNode;
  /** Top-right nav chrome (typically Close). */
  topRight?: ReactNode;
  /** Skip the surface background so the scaffold can layer over live camera. */
  transparent?: boolean;
  /** Optional per-presentation max-width override. Defaults to {@link CONTENT_MAX_WIDTH}. */
  maxWidth?: MaxWidthByPresentation;
  /** Optional style appended after the base root styles. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Renders the shared screen regions for a presentation.
 *
 * @param props Presentation, content, optional action band, corner slots, and flags.
 * @returns The scaffold element.
 */
export function ScreenScaffold({
  presentation,
  children,
  actionBand,
  topLeft,
  topRight,
  transparent = false,
  maxWidth = CONTENT_MAX_WIDTH,
  style,
}: ScreenScaffoldProps): JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = presentation === 'wide' ? SPACING.xl3 : SPACING.lg;

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.root, { backgroundColor: transparent ? 'transparent' : theme.colors.bg }, style]}
    >
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + SPACING.xl3,
            paddingHorizontal: gutter,
          },
        ]}
      >
        <ContentColumn presentation={presentation} maxWidth={maxWidth}>
          {children}
        </ContentColumn>
      </View>

      {actionBand ? (
        <View
          style={[
            styles.actionBand,
            {
              paddingBottom: insets.bottom + SPACING.xl,
              paddingHorizontal: gutter,
            },
          ]}
        >
          <ContentColumn presentation={presentation} maxWidth={maxWidth}>
            {actionBand}
          </ContentColumn>
        </View>
      ) : null}

      {topLeft ? (
        <View
          style={[
            styles.corner,
            { top: insets.top + SPACING.sm, left: insets.left + SPACING.lg },
          ]}
        >
          {topLeft}
        </View>
      ) : null}

      {topRight ? (
        <View
          style={[
            styles.corner,
            { top: insets.top + SPACING.sm, right: insets.right + SPACING.lg },
          ]}
        >
          {topRight}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  actionBand: {
    paddingTop: SPACING.lg,
    alignItems: 'stretch',
  },
  corner: {
    position: 'absolute',
    zIndex: 2,
  },
});
