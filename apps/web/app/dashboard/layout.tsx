import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Dashboard layout. The shell + sidebar live in the client component so the
 * server layout can stay tiny and just enforce noindex (per plan section 2).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
