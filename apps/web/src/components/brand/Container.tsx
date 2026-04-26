import type { ReactNode, HTMLAttributes } from 'react';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Width preset. `prose` clamps to 720px for long-form copy. */
  size?: 'default' | 'narrow' | 'wide' | 'prose';
}

/**
 * Page-width container. Default clamps to 1120px. `prose` is for long
 * articles where 720px hits the comfortable reading line length.
 */
export function Container({
  children,
  size = 'default',
  className = '',
  ...rest
}: ContainerProps): JSX.Element {
  const widths = {
    default: 'max-w-[1120px]',
    narrow: 'max-w-[880px]',
    wide: 'max-w-[1280px]',
    prose: 'max-w-[720px]',
  } as const;
  return (
    <div className={`mx-auto w-full px-6 ${widths[size]} ${className}`} {...rest}>
      {children}
    </div>
  );
}
