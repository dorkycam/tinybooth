import Link from 'next/link';

interface WordmarkProps {
  /** Optional sub-brand. Renders as "tinywall" with a small "by tinybooth" tag. */
  product?: 'tinybooth' | 'tinywall';
  /** Force the link target. Defaults to `/`. */
  href?: string;
  /** Tailwind class override for the wordmark size. */
  className?: string;
}

/**
 * Lockup mark for headers, footers, and OG images. Uses Manrope 700 and
 * tightened letter-spacing. The `tinywall` variant pulls in the lilac
 * accent and the "by tinybooth" sub-tag from the brand identity doc.
 */
export function Wordmark({
  product = 'tinybooth',
  href = '/',
  className = 'text-2xl',
}: WordmarkProps): JSX.Element {
  if (product === 'tinywall') {
    return (
      <Link href={href} className="inline-flex items-baseline gap-2">
        <span className={`font-bold tracking-tight text-lilac ${className}`} style={{ letterSpacing: '-0.02em' }}>
          tinywall
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-graphite">by tinybooth</span>
      </Link>
    );
  }
  return (
    <Link href={href} className="inline-flex items-baseline gap-2">
      <span className={`font-bold tracking-tight text-ink ${className}`} style={{ letterSpacing: '-0.02em' }}>
        tinybooth
      </span>
    </Link>
  );
}
