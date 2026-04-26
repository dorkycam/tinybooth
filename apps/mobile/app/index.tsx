/**
 * Home screen. Two CTAs: start a booth (camera) or open settings.
 *
 * Tablet layout splits the wordmark and CTAs into a two-column hero. Phone
 * layout stacks them vertically.
 */
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import { Wordmark } from '@/components/Wordmark';
import { useLayoutClass } from '@/lib/layout';
import { useTheme } from '@/theme/useTheme';

/**
 * Home screen. Tablet form factor centers the brand; phone stacks tight.
 */
export default function HomeScreen(): JSX.Element {
  const theme = useTheme();
  const { layoutClass } = useLayoutClass();
  const isTablet = layoutClass === 'tablet';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
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
        <View style={[styles.actions, isTablet ? styles.actionsTablet : null]}>
          <Link href="/(camera)" asChild>
            <View>
              <PrimaryButton label="Start a booth" onPress={() => undefined} />
            </View>
          </Link>
          <Link href="/(tabs)/settings" asChild>
            <View>
              <SecondaryButton label="Settings" onPress={() => undefined} />
            </View>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  containerPhone: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 48,
  },
  containerTablet: {
    flexDirection: 'column',
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
  actionsTablet: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 'auto',
    maxWidth: 600,
  },
});
