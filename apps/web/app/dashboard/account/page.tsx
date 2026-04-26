import { DashboardShell } from '../../../src/components/dashboard/DashboardShell';
import { AccountPanel } from '../../../src/components/dashboard/AccountPanel';

/** Account page: profile + Apple-required deletion flow. */
export default function AccountPage(): JSX.Element {
  return (
    <DashboardShell heading="Account">
      <AccountPanel />
    </DashboardShell>
  );
}
