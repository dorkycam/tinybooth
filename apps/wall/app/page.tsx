import Link from 'next/link';

/**
 * Wall app root. The product landing now lives on tinybooth.com/wall; this
 * page exists for the legacy `wall.tinybooth.com` host until the 301 redirect
 * is in place. Phase 5 removes it.
 */
export default function WallRoot(): JSX.Element {
  const webBase = process.env.NEXT_PUBLIC_WEB_BASE_URL ?? 'http://localhost:3000';
  const target = `${webBase}/wall`;
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-paper text-ink">
      <h1 className="text-5xl font-bold tracking-tight">TinyWall</h1>
      <p className="mt-3 text-lilac">by TinyBooth</p>
      <p className="mt-8 max-w-md text-center text-graphite">
        TinyWall has moved to tinybooth.com/wall. This subdomain stays alive as a redirect for now.
      </p>
      <Link
        href={target}
        className="mt-8 inline-flex items-center rounded-full bg-ink px-8 py-3 text-paper font-semibold hover:bg-coral transition-colors"
      >
        Go to tinybooth.com/wall
      </Link>
    </main>
  );
}
