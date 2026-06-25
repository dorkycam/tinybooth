/**
 * Camera + preview stack. Both screens share the modal presentation; only the
 * camera screen runs the capture loop.
 */
import type { JSX } from 'react';
import { Stack } from 'expo-router';

/** Camera group stack. */
export default function CameraGroupLayout(): JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="preview" />
    </Stack>
  );
}
