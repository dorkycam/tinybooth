import { DashboardShell } from '../../../../src/components/dashboard/DashboardShell';
import { EventDetail } from '../../../../src/components/dashboard/EventDetail';

interface EventDetailPageProps {
  params: { id: string };
}

/** Single event detail with overview/photos/branding/messages/settings tabs. */
export default function EventDetailPage({ params }: EventDetailPageProps): JSX.Element {
  return (
    <DashboardShell>
      <EventDetail eventId={params.id} />
    </DashboardShell>
  );
}
