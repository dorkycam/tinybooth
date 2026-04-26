import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/**
 * Wrapper for every marketing page. Renders the shared header/footer plus a
 * Paper-tinted background. Server component by default; pages can still
 * render client components inside.
 */
export function MarketingShell({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
