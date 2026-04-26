'use client';

/**
 * Marketing-scope error boundary. Catches uncaught errors thrown from any
 * marketing route segment (homepage, blog, pricing, etc.). Stays inside the
 * brand surface so the visitor still sees TinyBooth, not a stack trace.
 */
import { useEffect } from 'react';
import Link from 'next/link';

interface MarketingErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MarketingError({ error, reset }: MarketingErrorProps): JSX.Element {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app.error]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-paper text-ink flex items-center justify-center px-6">
      <div className="max-w-lg text-center rounded-3xl bg-cream/60 border border-stone p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral mb-3">
          Hit a snag
        </p>
        <h1 className="text-2xl font-bold mb-3">That page did not load.</h1>
        <p className="text-graphite mb-6">
          The error was logged. Try reloading, or jump back to the homepage.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-paper font-semibold hover:bg-coral focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-cream border border-stone px-6 py-3 text-ink font-semibold hover:bg-stone focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            Go home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-graphite">Reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
