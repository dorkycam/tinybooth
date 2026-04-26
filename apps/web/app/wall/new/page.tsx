import { CreateEventForm } from '../../../src/components/CreateEventForm';

/**
 * Anonymous event creation form. Returns the slug, share URL, QR code, and a
 * "claim later" email capture. Phase 3 wires the magic link via SES; Phase 1
 * just logs the captured email server-side.
 */
export default function NewEventPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-paper text-ink py-12 px-4">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold">Create a new wall</h1>
        <p className="mt-2 text-graphite">
          Set up a free TinyWall event in under a minute. We will give you a TV link and a QR code
          for guests.
        </p>
        <div className="mt-8">
          <CreateEventForm />
        </div>
      </div>
    </main>
  );
}
