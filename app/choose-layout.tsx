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
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LayoutChoiceCard } from '@/components/LayoutChoiceCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useIdleReset } from '@/hooks/useIdleReset';
import { useSettings } from '@/hooks/useSettings';
import { useLayoutClass } from '@/lib/layout';
import { STRIP_LAYOUTS, stripLayoutLabel, type StripLayout } from '@/lib/layouts';
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
  const { settings } = useSettings();
  const { layoutClass } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';

  // Idle reset: if a guest walks away while deciding, return to Start.
  const handleIdleTimeout = useCallback((): void => {
    router.replace('/');
  }, [router]);
  const { reset: resetIdleTimer } = useIdleReset(settings.idleReset, handleIdleTimeout);

  function handlePick(layout: StripLayout): void {
    router.push({ pathname: '/capture', params: { layout } });
  }

  // Return to Start. Fall back to a replace when there is no back entry.
  function handleBack(): void {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      onTouchStart={resetIdleTimer}
    >
      <ScreenHeader title="Pick a layout" subtitle="Both take 4 photos." onBack={handleBack} />
      <View style={[styles.cards, isTablet ? styles.cardsTablet : styles.cardsPhone]}>
        {STRIP_LAYOUTS.map((layout) => (
          <LayoutChoiceCard
            key={layout}
            layout={layout}
            label={stripLayoutLabel(layout)}
            description={LAYOUT_DESCRIPTIONS[layout]}
            onPress={handlePick}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  cards: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  cardsPhone: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  cardsTablet: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
