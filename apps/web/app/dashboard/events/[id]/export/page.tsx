import { DashboardShell } from '../../../../../src/components/dashboard/DashboardShell';
import { ExportRunner } from '../../../../../src/components/dashboard/ExportRunner';

interface ExportPageProps {
  params: { id: string };
}

/** Bulk export trigger + status poller. Behind EVENT_PASS+ tier on the server. */
export default function ExportPage({ params }: ExportPageProps): JSX.Element {
  return (
    <DashboardShell heading="Bulk export">
      <ExportRunner eventId={params.id} />
    </DashboardShell>
  );
}
