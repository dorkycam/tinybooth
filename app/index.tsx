/**
 * Start / idle screen.
 *
 * The resting state of a booth on a stand: a big Start button that opens the
 * layout picker, and a gear icon in the corner for Settings. The screen is kept
 * awake here so a propped-up tablet does not dim between guests.
 *
 * Tablet layout centers the brand with roomy spacing; phone stacks tight.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useLayoutClass } from '@/lib/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * Home screen. Start opens the layout picker; the gear opens Settings.
 */
export default function HomeScreen(): JSX.Element {
  useKeepAwake();
  const theme = useTheme();
  const router = useRouter();
  const { layoutClass } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.topBar}>
        <View />
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={16}
          style={({ pressed }) => [
            styles.gearButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.hairline,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.gearIcon, { color: theme.colors.fg }]}>{'⚙'}</Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.container,
          isTablet ? styles.containerTablet : styles.containerPhone,
        ]}
      >
        <View style={styles.brand}>
          <Wordmark size="lg" />
          <Text style={[styles.tagline, { color: theme.colors.subtle }]}>
            Take a photo. Get a strip. That's the whole app.
          </Text>
        </View>
        <View style={styles.actions}>
          <PrimaryButton label="Start" onPress={() => router.push('/choose-layout')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  gearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 22,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  containerPhone: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 48,
  },
  containerTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  brand: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 17,
    marginTop: 12,
    textAlign: 'center',
    maxWidth: 360,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
});
