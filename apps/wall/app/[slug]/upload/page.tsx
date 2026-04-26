import { notFound } from 'next/navigation';
import { UploadFlow } from '../../../src/components/upload/UploadFlow';
import { getEventBySlug, webBase } from '../../../src/lib/serverApi';

interface UploadPageProps {
  params: { slug: string };
}

/**
 * Guest upload page. Server fetch loads the event, client component runs the
 * state machine.
 */
export default async function UploadPage({ params }: UploadPageProps): Promise<JSX.Element> {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  return (
    <UploadFlow
      eventId={event.id}
      eventName={event.name}
      eventSlug={event.slug}
      webApiBase={webBase()}
    />
  );
}
