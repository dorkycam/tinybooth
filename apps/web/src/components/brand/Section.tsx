import type { ReactNode, HTMLAttributes } from 'react';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  /** Optional eyebrow text rendered above the heading. */
  eyebrow?: string;
  /** Optional section heading; renders as h2. */
  heading?: string;
  /** Optional sub-heading paragraph rendered under the heading. */
  lead?: string;
  /** Tighter vertical padding for nested sections. */
  tight?: boolean;
}

/**
 * Marketing section primitive. Encapsulates the standard 80px vertical
 * spacing + optional eyebrow/heading/lead so pages stay consistent.
 */
export function Section({
  children,
  eyebrow,
  heading,
  lead,
  tight,
  className = '',
  ...rest
}: SectionProps): JSX.Element {
  const verticalPad = tight ? 'py-12 md:py-16' : 'py-16 md:py-24';
  return (
    <section className={`${verticalPad} ${className}`} {...rest}>
      {eyebrow || heading || lead ? (
        <header className="mb-10 max-w-[720px]">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral mb-3">
              {eyebrow}
            </p>
          ) : null}
          {heading ? (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">{heading}</h2>
          ) : null}
          {lead ? <p className="mt-4 text-lg text-graphite">{lead}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
