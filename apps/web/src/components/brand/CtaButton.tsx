import Link from 'next/link';
import type { ReactNode } from 'react';

interface CtaButtonProps {
  href: string;
  children: ReactNode;
  /** Visual style. `primary` is Ink fill, `secondary` is Cream fill. */
  variant?: 'primary' | 'secondary';
  /** Render the link as external when true (opens new tab, rel noreferrer). */
  external?: boolean;
  className?: string;
}

/**
 * CTA link styled like a button. Used across marketing pages so the App
 * Store / Play Store / "Start a wall" buttons stay consistent.
 */
export function CtaButton({
  href,
  children,
  variant = 'primary',
  external,
  className = '',
}: CtaButtonProps): JSX.Element {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-colors text-base';
  const styles =
    variant === 'primary'
      ? 'bg-ink text-paper hover:bg-coral'
      : 'bg-cream text-ink hover:bg-stone border border-stone';
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={`${base} ${styles} ${className}`}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
