/** Shown when a wall slug does not match an event. */
export default function NotFound(): JSX.Element {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-paper text-ink text-center">
      <h1 className="text-3xl font-bold">Wall not found</h1>
      <p className="mt-3 text-graphite max-w-md">
        We could not find a TinyWall event at that slug. Double-check the URL or ask the host for
        a fresh link.
      </p>
    </main>
  );
}
