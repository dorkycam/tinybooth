'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Wordmark } from './Wordmark';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: '/app', label: 'App' },
  { href: '/wall', label: 'Wall' },
  { href: '/events', label: 'Events' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/help', label: 'Help' },
] as const;

/**
 * Top nav for the marketing site. Phone shows a hamburger; tablet (md+)
 * shows the full nav. Stays sticky for visibility while reading long pages.
 */
export function SiteHeader(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 w-full bg-paper/85 backdrop-blur border-b border-stone">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-4 flex items-center justify-between gap-4">
        <Wordmark className="text-xl md:text-2xl" />
        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-semibold text-ink">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-coral transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link
            href="/wall/new"
            className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-coral transition-colors"
          >
            Start a wall
          </Link>
        </div>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={(): void => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-md border border-stone p-2 text-ink"
        >
          <span aria-hidden className="block w-5 h-[2px] bg-ink relative">
            <span className="absolute left-0 -top-[6px] block w-5 h-[2px] bg-ink" />
            <span className="absolute left-0 top-[6px] block w-5 h-[2px] bg-ink" />
          </span>
        </button>
      </div>
      {open ? (
        <nav aria-label="Mobile" className="md:hidden border-t border-stone bg-paper">
          <ul className="px-6 py-4 flex flex-col gap-3 text-base font-semibold">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={(): void => setOpen(false)}
                  className="block py-1 hover:text-coral"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/wall/new"
                onClick={(): void => setOpen(false)}
                className="inline-flex items-center rounded-full bg-ink px-4 py-2 mt-2 text-sm text-paper"
              >
                Start a wall
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
