import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getRandomMessage } from '@tinybooth/messages';
import { LIGHT_COLORS } from '@tinybooth/ui-tokens';

/**
 * Phase 0 placeholder. Renders the TinyBooth wordmark and a random message
 * from the migrated Swift library to confirm cross-package imports work.
 *
 * The real camera + photostrip flow lands in Phase 2.
 */
export default function App(): JSX.Element {
  const message = useMemo<string>(() => getRandomMessage(), []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.wordmark}>tinybooth</Text>
          <Text style={styles.subtitle}>{message}</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LIGHT_COLORS.paper,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  wordmark: {
    color: LIGHT_COLORS.ink,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: LIGHT_COLORS.coral,
    fontSize: 24,
    marginTop: 12,
  },
});
