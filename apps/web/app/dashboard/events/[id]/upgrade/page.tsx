import { DashboardShell } from '../../../../../src/components/dashboard/DashboardShell';
import { UpgradePaywall } from '../../../../../src/components/dashboard/UpgradePaywall';

interface UpgradePageProps {
  params: { id: string };
}

/**
 * Per-event paywall page. Two-card layout (Event Pass + Event Pass Plus)
 * with Stripe Checkout CTAs. Strip Unlock is intentionally not surfaced here
 * because it is mobile / IAP only.
 */
export default function UpgradePage({ params }: UpgradePageProps): JSX.Element {
  return (
    <DashboardShell>
      <UpgradePaywall eventId={params.id} />
    </DashboardShell>
  );
}
