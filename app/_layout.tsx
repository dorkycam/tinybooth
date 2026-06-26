/**
 * Root layout for Expo Router. Wraps the whole app in the safe-area provider and
 * the theme preference provider, and registers the booth flow as one flat stack:
 * Start -> Choose layout -> Capture -> Preview, plus Settings.
 *
 * The Skia compose bridge is installed at module load so it is present on
 * `globalThis` before the capture screen mounts. The native splash is held until
 * settings have hydrated and a short minimum has elapsed, then handed off to the
 * JS {@link AppSplash} before the navigation stack appears.
 */
import { type JSX, useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSplash } from '@/components/AppSplash';
import { useSettings } from '@/hooks/useSettings';
import { installSkiaBridge } from '@/lib/skiaBridge';
import { ThemePreferenceProvider } from '@/theme/ThemeContext';

installSkiaBridge();

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Top-level navigation root. */
export default function RootLayout(): JSX.Element {
  const { ready } = useSettings();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 900);
    return () => clearTimeout(t);
  }, []);

  const appReady = ready && minElapsed;

  const onLayoutRoot = useCallback((): void => {
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRoot}>
          {appReady ? (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="choose-layout" />
              <Stack.Screen name="capture" options={{ animation: 'fade' }} />
              <Stack.Screen name="preview" options={{ animation: 'fade' }} />
              <Stack.Screen name="settings" />
            </Stack>
          ) : (
            <AppSplash />
          )}
          <StatusBar style="auto" />
        </View>
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
