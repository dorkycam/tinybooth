/**
 * Settings / help / privacy / event tab group. We use a Stack rather than a
 * Tabs nav because the screens are reachable from a settings menu, not a
 * bottom bar.
 */
import type { JSX } from 'react';
import { Stack } from 'expo-router';

/** Tab group stack. */
export default function TabsLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="event" />
    </Stack>
  );
}
