/**
 * Presentation context.
 *
 * Computes the active {@link LayoutDescriptor} once at the root via
 * {@link useLayoutClass} and shares it through React context so every screen can
 * read the current presentation without each subscribing to window dimensions
 * independently. Screens call {@link usePresentation} instead of
 * `useLayoutClass()` directly.
 */
import { type JSX, type ReactNode, createContext, useContext, useMemo } from 'react';
import { useLayoutClass, type LayoutDescriptor } from './layout';

/** Context value: the active layout descriptor, or `null` outside a provider. */
const PresentationContextValue = createContext<LayoutDescriptor | null>(null);

/** Props for {@link PresentationProvider}. */
interface PresentationProviderProps {
  /** The subtree that can read the presentation. */
  children: ReactNode;
}

/**
 * Provides the active {@link LayoutDescriptor} to its subtree.
 *
 * Calls {@link useLayoutClass} once and memoizes the descriptor so consumers
 * re-render only when a field actually changes.
 *
 * @param props The subtree to provide to.
 * @returns The provider element.
 */
export function PresentationProvider({ children }: PresentationProviderProps): JSX.Element {
  const descriptor = useLayoutClass();
  const value = useMemo(
    () => descriptor,
    [
      descriptor.layoutClass,
      descriptor.orientation,
      descriptor.presentation,
      descriptor.width,
      descriptor.height,
    ],
  );
  return (
    <PresentationContextValue.Provider value={value}>{children}</PresentationContextValue.Provider>
  );
}

/**
 * Reads the active {@link LayoutDescriptor} from context.
 *
 * @throws If called outside a {@link PresentationProvider}.
 * @returns The active layout descriptor.
 */
export function usePresentation(): LayoutDescriptor {
  const value = useContext(PresentationContextValue);
  if (value === null) {
    throw new Error('usePresentation must be used within a PresentationProvider');
  }
  return value;
}
