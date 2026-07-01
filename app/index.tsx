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
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { StartBackdrop } from '@/components/StartBackdrop';
import { Wordmark } from '@/components/Wordmark';
import { usePresentation } from '@/lib/PresentationContext';
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
  const { presentation } = usePresentation();

  // Run the backdrop camera only while Start is focused. Off-screen (during
  // capture) the camera is released so vision-camera hands the front device to
  // the capture screen; on return, focus re-activates it. This keeps manual
  // Close and idle auto-close on the same path back to a live preview.
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );

  return (
    <StartBackdrop isActive={isFocused}>
      <View style={styles.root}>
        <ScreenScaffold
          presentation={presentation}
          transparent
          maxWidth={{ stacked: 480, wide: 640 }}
          actionBand={
            <View style={styles.actions}>
              <PrimaryButton label="Start" onPress={() => router.push('/choose-layout')} />
            </View>
          }
        >
          <View style={styles.brand}>
            <Wordmark size="lg" style={{ color: theme.colors.flash }} />
            <Text style={[styles.tagline, { color: theme.colors.fg }]}>
              Tap below to start then strike a pose.
            </Text>
          </View>
        </ScreenScaffold>
        {/* Operator-only chrome: deliberately outside the guest reach band. */}
        <SafeAreaView edges={['top', 'right']} pointerEvents="box-none" style={styles.topBar}>
          <IconButton
            icon="settings-outline"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
            glass
            size={44}
            scheme="dark"
          />
        </SafeAreaView>
      </View>
    </StartBackdrop>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
    zIndex: 3,
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
    alignSelf: 'center',
    gap: 12,
  },
});
