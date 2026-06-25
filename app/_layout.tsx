/**
 * Root layout for Expo Router. Wraps the whole app in the safe-area provider and
 * the theme preference provider, and registers the booth flow as one flat stack:
 * Start -> Choose layout -> Capture -> Preview, plus Settings.
 *
 * The Skia compose bridge is installed at module load so it is present on
 * `globalThis` before the capture screen mounts.
 */
import type { JSX } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installSkiaBridge } from '@/lib/skiaBridge';
import { ThemePreferenceProvider } from '@/theme/ThemeContext';

installSkiaBridge();

/** Top-level navigation root. */
export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="choose-layout" />
          <Stack.Screen name="capture" options={{ animation: 'fade' }} />
          <Stack.Screen name="preview" options={{ animation: 'fade' }} />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="auto" />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
