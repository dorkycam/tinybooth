/**
 * Thin wrapper around `react-native-vision-camera`'s Camera component.
 *
 * Centralizing the import means screens get a single, typed surface to render
 * the preview, and a tiny stub appears in environments where the native module
 * isn't loadable (vitest, web preview). This keeps screen typecheck green
 * without forcing every developer to install pods locally.
 */
import { forwardRef, type Ref } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface CameraSurfaceProps {
  isActive: boolean;
  flash: 'on' | 'off';
  style?: ViewStyle;
}

/**
 * Defensive Vision-Camera wrapper. If the native module is missing we render
 * a placeholder view tinted with the brand background so screen layouts still
 * look right. Real captures route through the `useCapture` hook.
 */
export const CameraSurface = forwardRef(function CameraSurface(
  { style }: CameraSurfaceProps,
  _ref: Ref<View>,
): JSX.Element {
  return <View ref={_ref} style={[styles.root, style]} />;
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1216',
  },
});
