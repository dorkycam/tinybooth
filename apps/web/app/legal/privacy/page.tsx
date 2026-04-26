import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy policy - TinyBooth',
  description: 'How TinyBooth collects, uses, and deletes your data.',
};

/**
 * Privacy policy page. Plain-language summary, plus an explicit account
 * deletion section (Apple Guideline 5.1.1(v) and CCPA/GDPR right-to-erasure).
 */
export default function PrivacyPolicyPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-paper text-ink py-12 px-6">
      <article className="max-w-2xl mx-auto prose prose-stone">
        <h1 className="text-4xl font-bold">Privacy policy</h1>
        <p className="text-graphite text-sm">Last updated: 2026-04-26</p>

        <h2 className="text-xl font-bold mt-8">What we collect</h2>
        <ul className="list-disc pl-6 text-sm leading-7">
          <li>Photos uploaded to a TinyWall event you host or attend.</li>
          <li>Photostrips you take in the TinyBooth app, when you opt to tie them to an event.</li>
          <li>Your email and a Supabase user id when you sign in to host events.</li>
          <li>Optional email or phone number when you ask the booth to text or email you a strip.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">What we do not collect</h2>
        <ul className="list-disc pl-6 text-sm leading-7">
          <li>No tracking pixels on the marketing site.</li>
          <li>No third-party advertising.</li>
          <li>Standalone TinyBooth photos stay on your device and never reach our servers.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">Retention</h2>
        <p className="text-sm leading-7">
          Free TinyWall events keep photos for 7 days after the event. Event Pass
          extends to 60 days; Event Pass Plus extends to 90. Past those windows
          a cron job deletes both the database rows and the storage objects.
          Bulk export zips delete after 24 hours.
        </p>

        <h2 className="text-xl font-bold mt-8" id="data-deletion">Data deletion</h2>
        <p className="text-sm leading-7">
          You can delete your account and every event you own from inside the
          TinyBooth iOS app, the TinyBooth Android app, or on the web at{' '}
          <Link href="/dashboard/account" className="text-coral underline">
            tinybooth.com/dashboard/account
          </Link>
          . The flow is a two-step confirmation; once you confirm, every owned
          event, every guest upload tied to that event, and every booth strip
          tied to that event is removed within minutes. R2 storage objects are
          purged in the same request on a best-effort basis; any objects that
          fail to delete in line are swept by the hourly cleanup cron.
        </p>
        <p className="text-sm leading-7">
          You can also email <a href="mailto:hello@tinybooth.com" className="text-coral underline">hello@tinybooth.com</a> and
          we will process the deletion within 30 days (matching CCPA / GDPR
          right-to-erasure timelines).
        </p>

        <h2 className="text-xl font-bold mt-8">Service providers</h2>
        <ul className="list-disc pl-6 text-sm leading-7">
          <li>Supabase: database + authentication.</li>
          <li>Cloudflare R2: photo storage.</li>
          <li>AWS SES: transactional email.</li>
          <li>Twilio: optional SMS for paid hosts.</li>
          <li>RevenueCat + Apple/Google: in-app purchase processing.</li>
        </ul>

        <h2 className="text-xl font-bold mt-8">Contact</h2>
        <p className="text-sm leading-7">
          Questions? Email <a href="mailto:hello@tinybooth.com" className="text-coral underline">hello@tinybooth.com</a>.
        </p>
      </article>
    </main>
  );
}
