import { DashboardShell } from '../../../../src/components/dashboard/DashboardShell';
import { NewEventForm } from '../../../../src/components/dashboard/NewEventForm';

/** Authed event-creation flow with branding + settings. */
export default function NewEventPage(): JSX.Element {
  return (
    <DashboardShell heading="Create event">
      <NewEventForm />
    </DashboardShell>
  );
}
