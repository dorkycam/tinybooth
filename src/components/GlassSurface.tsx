/**
 * Liquid Glass surface.
 *
 * Renders Apple's Liquid Glass material (iOS 26+) via `expo-glass-effect`, and
 * falls back to a solid themed surface everywhere it is not available (older
 * iOS, Android, web). Callers pass the `fallbackColor` so the non-glass look
 * matches the screen's existing design.
 *
 * Library-style: purely presentational. Give it a shape via `style`
 * (borderRadius, padding, size) and it clips the glass to that shape.
 */
import type { JSX, ReactNode } from 'react';
import {
  GlassView,
  type GlassStyle,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/** True once per launch when the device supports Liquid Glass (iOS 26+). */
export const GLASS_AVAILABLE: boolean = isLiquidGlassAvailable();

/** Props for {@link GlassSurface}. */
export interface GlassSurfaceProps {
  /** Content rendered on top of the glass. */
  children?: ReactNode;
  /** Shape and layout for the surface (borderRadius, padding, size, position). */
  style?: StyleProp<ViewStyle>;
  /** Glass material style. `regular` is frosted, `clear` is more transparent. */
  glassStyle?: GlassStyle;
  /** Optional tint laid over the glass. */
  tintColor?: string;
  /** Whether the glass reacts to touches (use for buttons). */
  interactive?: boolean;
  /** Force the glass appearance regardless of system theme. Defaults to `dark`. */
  colorScheme?: 'auto' | 'light' | 'dark';
  /** Solid background used when Liquid Glass is unavailable. */
  fallbackColor: string;
}

/**
 * A Liquid Glass surface with a themed solid fallback.
 *
 * @param props Shape, glass options, and the required `fallbackColor`.
 * @returns The rendered glass (iOS 26+) or solid surface.
 */
export function GlassSurface({
  children,
  style,
  glassStyle = 'regular',
  tintColor,
  interactive = false,
  colorScheme = 'dark',
  fallbackColor,
}: GlassSurfaceProps): JSX.Element {
  if (GLASS_AVAILABLE) {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassStyle}
        tintColor={tintColor}
        isInteractive={interactive}
        colorScheme={colorScheme}
      >
        {children}
      </GlassView>
    );
  }
  return <View style={[style, { backgroundColor: fallbackColor }]}>{children}</View>;
}
