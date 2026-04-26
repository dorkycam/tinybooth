import { EventsList } from '../../src/components/dashboard/EventsList';
import { DashboardShell } from '../../src/components/dashboard/DashboardShell';

/** Dashboard root: list of events the signed-in user owns. */
export default function DashboardPage(): JSX.Element {
  return (
    <DashboardShell heading="Your events">
      <EventsList />
    </DashboardShell>
  );
}
