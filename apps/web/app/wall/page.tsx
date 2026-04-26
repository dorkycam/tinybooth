import Link from 'next/link';

/**
 * Wall product landing page on tinybooth.com/wall. Replaces the old
 * wall.tinybooth.com root.
 */
export default function WallLanding(): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-paper text-ink">
      <h1 className="text-5xl md:text-6xl font-bold tracking-tight">TinyWall</h1>
      <p className="mt-3 text-lilac text-lg">by TinyBooth</p>
      <p className="mt-8 max-w-xl text-center text-graphite">
        A live photo wall for parties. Guests scan a QR code, take a picture, and it lands on the
        TV in seconds. No app to download. No account required.
      </p>
      <Link
        href="/wall/new"
        className="mt-10 inline-flex items-center rounded-full bg-ink px-8 py-3 text-paper font-semibold hover:bg-coral transition-colors"
      >
        Create an event
      </Link>
      <p className="mt-6 text-sm text-graphite">
        Free events keep 100 uploads for 7 days. Paid events extend retention and unlock branding.
      </p>
    </main>
  );
}
