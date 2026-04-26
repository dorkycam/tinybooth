'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useDashboardAuth } from '../../lib/useDashboardAuth';
import { SignInPanel } from './SignInPanel';

interface DashboardShellProps {
  children: ReactNode;
  /** Optional in-shell page heading. */
  heading?: string;
}

const NAV_ITEMS: Array<{ href: string; label: string }> = [
  { href: '/dashboard', label: 'Events' },
  { href: '/dashboard/account', label: 'Account' },
];

/**
 * Dashboard chrome: left sidebar with the user identity + nav, right column
 * for page content. Gates every dashboard page on a resolved session; renders
 * the SignInPanel when not authenticated.
 */
export function DashboardShell({ children, heading }: DashboardShellProps): JSX.Element {
  const auth = useDashboardAuth();
  const pathname = usePathname() ?? '/dashboard';

  if (auth.loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper text-graphite">
        Loading dashboard...
      </main>
    );
  }
  if (!auth.userId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-4 py-12">
        <SignInPanel auth={auth} />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-stone bg-cream px-6 py-6 flex flex-col">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          tinybooth
        </Link>
        <p className="text-graphite text-xs mt-1">dashboard</p>
        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active ? 'bg-ink text-paper' : 'text-ink hover:bg-stone'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 text-xs text-graphite">
          {auth.email ? <p className="break-all">{auth.email}</p> : <p>Signed in</p>}
          <button
            type="button"
            onClick={() => void auth.signOut()}
            className="mt-2 underline hover:text-coral"
          >
            Sign out
          </button>
        </div>
      </aside>
      <section className="flex-1 px-6 md:px-10 py-8">
        {heading ? <h1 className="text-3xl font-bold mb-6">{heading}</h1> : null}
        {children}
      </section>
    </div>
  );
}
