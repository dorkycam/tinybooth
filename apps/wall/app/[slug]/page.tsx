import { notFound } from 'next/navigation';
import { PhotoGrid } from '../../src/components/tv/PhotoGrid';
import { getEventBySlug, getPostsForEvent } from '../../src/lib/serverApi';

interface TVPageProps {
  params: { slug: string };
}

const DEFAULT_SLIDESHOW_SPEED = 3.5;

/**
 * TV display. Server component fetches the initial event + posts, then hands
 * off to the realtime grid client component.
 */
export default async function TVPage({ params }: TVPageProps): Promise<JSX.Element> {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  const posts = await getPostsForEvent(event.id);
  const settings = (event.settings ?? {}) as { slideshowSpeedSeconds?: number };
  const speed = typeof settings.slideshowSpeedSeconds === 'number'
    ? settings.slideshowSpeedSeconds
    : DEFAULT_SLIDESHOW_SPEED;

  const origin = process.env.NEXT_PUBLIC_WALL_BASE_URL ?? '';
  const uploadUrl = `${origin}/${event.slug}/upload`;

  return (
    <PhotoGrid
      eventId={event.id}
      eventName={event.name}
      uploadUrl={uploadUrl}
      initialPosts={posts}
      slideShowSpeed={speed}
    />
  );
}
