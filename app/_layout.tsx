/**
 * Root layout for Expo Router. Wraps the entire app in the safe-area provider,
 * the theme preference provider, and registers the stack groups
 * (`(camera)` and `(tabs)`).
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
          <Stack.Screen name="(camera)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style="auto" />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
