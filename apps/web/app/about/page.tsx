import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  CtaButton,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { JsonLd, breadcrumbsSchema } from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'About TinyBooth',
  description:
    'TinyBooth is built by Camrynn Dilley in Los Angeles. Independent, no VCs, no growth-at-any-cost. The plan is to make a small product that makes the night look better.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About TinyBooth',
    description: 'Built by one person in Los Angeles. Independent, no VCs.',
    url: '/about',
  },
};

/**
 * /about — short. Independent solo project, LA-based, the why.
 */
export default function AboutPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'About', path: '/about' },
        ])}
      />

      <Container size="prose">
        <Section eyebrow="About" heading="A small product, made on purpose.">
          <p className="text-graphite text-lg leading-relaxed">
            TinyBooth started as a free iOS photobooth app in 2020. People liked it. Reviews said
            things like &ldquo;exactly what I was looking for after struggling with overpriced
            alternatives.&rdquo; The app stayed free for five years, with no account, no signup,
            no ads.
          </p>
          <p className="mt-5 text-graphite text-lg leading-relaxed">
            In 2026 it&apos;s a tablet-first app on iOS and Android plus a no-app guest photo wall
            (TinyWall) that runs on any browser. Same simplicity. Same random message after every
            shot. The same nine messages from the original library are still in there. New stuff
            (the photo wall, custom branding, IG-format share, AirPrint queue auto-recover) gets
            added without breaking the open-it-and-take-a-photo loop that made the first version
            work.
          </p>
          <p className="mt-5 text-graphite text-lg leading-relaxed">
            It&apos;s built by Camrynn Dilley. One person, Los Angeles, no VCs, no growth team,
            no ad budget. The plan is to keep it small enough to be polished and big enough to be
            useful. The free tier stays free. The paid tier is one-time per event.
          </p>

          <h2 className="text-2xl font-bold text-ink mt-12">What we will not do</h2>
          <ul className="mt-4 space-y-2 text-graphite leading-relaxed">
            <li>+ Lock the print button behind a paywall.</li>
            <li>+ Make existing iOS users sign in to keep using the standalone app.</li>
            <li>+ Sell your photos. Run ads. Resell your email.</li>
            <li>+ Pivot to a $99 monthly subscription.</li>
            <li>+ Disappear without 60 to 90 days of advance retention plus a one-tap zip export.</li>
          </ul>

          <h2 className="text-2xl font-bold text-ink mt-12">Where it lives</h2>
          <p className="text-graphite leading-relaxed mt-4">
            Built on Expo (React Native) for mobile, Next.js on Vercel for the web, Supabase for
            auth + database + realtime, Cloudflare R2 for storage. Tested against a Canon Selphy
            CP1500. Deployed in California. Email{' '}
            <a href="mailto:hello@tinybooth.com" className="text-coral underline">
              hello@tinybooth.com
            </a>{' '}
            for anything.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold border border-stone bg-cream text-ink hover:bg-stone">
              Say hi
            </Link>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
