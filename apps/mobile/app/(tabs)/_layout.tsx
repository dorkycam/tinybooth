/**
 * Settings / help / privacy tab group. We use a Stack rather than a Tabs nav
 * because the three screens are reachable from a settings menu, not a bottom
 * bar.
 */
import { Stack } from 'expo-router';

/** Tab group stack. */
export default function TabsLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
