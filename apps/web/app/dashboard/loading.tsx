/**
 * Dashboard-scope loading skeleton. Rendered by Next.js while a server-component
 * route segment is streaming. Keeps the visual rhythm of the events grid so the
 * page does not jump when real data arrives.
 */
export default function DashboardLoading(): JSX.Element {
  return (
    <div className="min-h-screen bg-paper text-ink px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div
          aria-hidden
          className="h-7 w-40 rounded-full bg-cream/80 mb-6 animate-pulse"
        />
        <div
          aria-hidden
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl bg-cream/60 border border-stone p-6 h-44 animate-pulse"
            />
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading your dashboard.
        </p>
      </div>
    </div>
  );
}
