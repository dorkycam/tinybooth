/**
 * Start / idle screen.
 *
 * The resting state of a booth on a stand. The background is the live front
 * camera preview, dimmed by a scrim, so the booth reads as already on. A big
 * Start button opens the layout picker, and a gear icon in the corner opens
 * Settings. The screen is kept awake here so a propped-up tablet does not dim
 * between guests.
 *
 * Tablet layout centers the brand with roomy spacing; phone stacks tight.
 */
import type { JSX } from 'react';
import { useKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StartBackdrop } from '@/components/StartBackdrop';
import { Wordmark } from '@/components/Wordmark';
import { useLayoutClass } from '@/lib/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * Home screen. The live preview fills the background; Start opens the layout
 * picker and the gear opens Settings.
 */
export default function HomeScreen(): JSX.Element {
  useKeepAwake();
  // Force dark tokens for foreground copy so it stays legible over the dark
  // scrim regardless of the user's theme preference.
  const theme = useTheme('dark');
  const router = useRouter();
  const { layoutClass } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';

  return (
    <StartBackdrop isActive>
      <SafeAreaView style={styles.root}>
        <View style={styles.topBar}>
          <View />
          <IconButton
            icon="settings-outline"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            size={44}
          />
        </View>
        <View
          style={[
            styles.container,
            isTablet ? styles.containerTablet : styles.containerPhone,
          ]}
        >
          <View style={styles.brand}>
            <Wordmark size="lg" />
            <Text style={[styles.tagline, { color: theme.colors.fg }]}>
              Strike a pose, then tap below to start.
            </Text>
          </View>
          <View style={styles.actions}>
            <PrimaryButton label="Start" onPress={() => router.push('/choose-layout')} />
          </View>
        </View>
      </SafeAreaView>
    </StartBackdrop>
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
