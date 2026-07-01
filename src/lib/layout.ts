/**
 * Tablet-first layout helpers (RN hook surface).
 *
 * Pure classification logic lives in `./layoutClass.ts` so unit tests can
 * import it without pulling in the React Native runtime.
 */
import { useWindowDimensions } from 'react-native';
import {
  classifyDimensions,
  type LayoutDescriptor,
} from './layoutClass';

export {
  classifyDimensions,
  TABLET_BREAKPOINT,
  CONTENT_MAX_WIDTH,
  type LayoutClass,
  type Orientation,
  type Presentation,
  type LayoutDescriptor,
} from './layoutClass';

/**
 * Returns the active layout class and orientation. Tablet is the default form
 * factor for TinyBooth (per the brand identity doc); phone is the fallback.
 *
 * @returns `LayoutDescriptor` keyed off the current window dimensions.
 */
export function useLayoutClass(): LayoutDescriptor {
  const { width, height } = useWindowDimensions();
  return classifyDimensions(width, height);
}
