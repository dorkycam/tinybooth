/**
 * Choose layout screen.
 *
 * Step two of the booth flow: pick Classic strip or Quad grid (both 4 shots in
 * v1). Selecting one routes to capture with the chosen layout id. The screen is
 * kept awake so the booth does not dim while a guest decides.
 *
 * Thin screen: the cards are an extracted, library-style component.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentColumn } from '@/components/ContentColumn';
import { LayoutChoiceCard } from '@/components/LayoutChoiceCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { usePresentation } from '@/lib/PresentationContext';
import { STRIP_LAYOUTS, stripLayoutLabel, type StripLayout } from '@/lib/layouts';
import { SPACING } from '@/theme/tokens/spacing';
import { useTheme } from '@/theme/useTheme';

/** One-line descriptions per layout, shown on the cards. */
const LAYOUT_DESCRIPTIONS: Record<StripLayout, string> = {
  classic: '4 shots stacked in two columns, cut down the middle.',
  quad: '4 shots in a 2x2 grid.',
};

/** Choose layout screen entry point. */
export default function ChooseLayoutScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme();
  const router = useRouter();
  const { presentation } = usePresentation();

  function handlePick(layout: StripLayout): void {
    router.push({ pathname: '/capture', params: { layout } });
  }

  // Return to Start. Fall back to a replace when there is no back entry.
  function handleBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const isWide = presentation === 'wide';
  const cardGroupStyle: ViewStyle = {
    flexDirection: isWide ? 'row' : 'column',
    alignItems: isWide ? 'center' : 'stretch',
    gap: SPACING.lg,
  };

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      <ScreenHeader title="Pick a layout" subtitle="Both take 4 photos." onBack={handleBack} />
      <View style={styles.band}>
        <ContentColumn
          presentation={presentation}
          maxWidth={CARD_GROUP_MAX_WIDTH}
          style={cardGroupStyle}
        >
          {STRIP_LAYOUTS.map((layout) => (
            <LayoutChoiceCard
              key={layout}
              layout={layout}
              label={stripLayoutLabel(layout)}
              description={LAYOUT_DESCRIPTIONS[layout]}
              onPress={handlePick}
              style={isWide ? styles.cardWide : undefined}
            />
          ))}
        </ContentColumn>
      </View>
    </SafeAreaView>
  );
}

/** Max card-group width per presentation (wider row on tablet landscape). */
const CARD_GROUP_MAX_WIDTH = { stacked: 440, wide: 760 } as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  // Cards sit centered in the space under the header; the bottom padding nudges
  // them slightly above true center, toward the optical center.
  band: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl3,
  },
  cardWide: {
    flex: 1,
  },
});
