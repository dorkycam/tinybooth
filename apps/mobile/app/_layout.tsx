/**
 * Root layout for Expo Router. Wraps the entire app in the safe-area provider
 * and registers the stack groups (`(camera)` and `(tabs)`).
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { installSkiaBridge } from '@/lib/skiaBridge';

installSkiaBridge();

/** Top-level navigation root. */
export default function RootLayout(): JSX.Element {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(camera)" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
