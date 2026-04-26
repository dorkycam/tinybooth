import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  CtaButton,
  Faq,
  FeatureGrid,
  MarketingShell,
  Section,
} from '../src/components/brand';
import { JsonLd, breadcrumbsSchema, softwareApplicationSchema } from '../src/components/seo';

export const metadata: Metadata = {
  title: 'TinyBooth - tablet photo booth app + party photo wall',
  description:
    'TinyBooth is a tablet photobooth app and a no-app guest photo wall under one event. Free to start, $14.99 for an event with branding, the wall, and a 60-day archive.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'TinyBooth - tablet photo booth app + party photo wall',
    description:
      'A tablet-first booth + a guest QR wall, in one event. Built for hosts who got priced out of the $1,170 rental.',
    url: '/',
  },
};

const APP_FEATURES = [
  {
    title: 'Five strip layouts',
    body: '1x4 classic, 2x2, 1x3, single, and 1x6 double. Pick before the shoot or change between strips.',
  },
  {
    title: 'AirPrint to a Selphy',
    body: 'Tested against Canon Selphy CP1500. The print queue auto-recovers after the iOS print stall at 8 to 10 prints.',
  },
  {
    title: 'The random message',
    body: 'The 9 messages from the original app, plus your own custom additions on Event Pass Plus.',
  },
] as const;

const WALL_FEATURES = [
  {
    title: 'No app for guests',
    body: 'Print one QR code. Scan, take a photo, see it on the TV in under two seconds.',
  },
  {
    title: 'Free wall, real wall',
    body: '100 uploads and 7 days on the free tier. Beats Kululu (50) and crushes LiveShareNow (10 newest).',
  },
  {
    title: 'Live slideshow',
    body: 'Open the URL on a Smart TV browser, AirPlay from a laptop, or plug a Chromecast in. No casting hardware required.',
  },
] as const;

const HOMEPAGE_FAQ = [
  {
    question: 'Do guests need to download an app?',
    answer: 'No. They scan a QR code, snap a photo in their browser, and it lands on the TV. No account, no install.',
  },
  {
    question: 'How much does it cost?',
    answer: (
      <>
        Free for personal use of the booth and free for a small TinyWall (100 uploads, 7 days).{' '}
        <Link href="/pricing" className="text-coral underline">
          Event Pass is $14.99 in the app or $12.99 on the web
        </Link>{' '}
        for a full event with branding, retention, and the wall combined.
      </>
    ),
  },
  {
    question: 'Will my data disappear like WedPics did?',
    answer:
      'No. You can bulk-export every photo for an event from the dashboard at any point during retention. Free events are 7 days; Event Pass is 60 days; Event Pass Plus is 90 days.',
  },
  {
    question: 'Is TinyBooth on Android?',
    answer: 'The app is iOS first today and Android is wired into the same codebase for the next release. The TinyWall guest flow already works on every phone with a browser.',
  },
] as const;

/**
 * Homepage. Hero introduces the dual product story (booth + wall under one
 * event), then splits into two product overview blocks, a comparison-vs-rental
 * angle pulled from the user research, and a short FAQ. All copy is server
 * rendered; no client JS on the homepage besides the header hamburger.
 */
export default function HomePage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={breadcrumbsSchema([{ name: 'TinyBooth', path: '/' }])} />

      <Container>
        <section className="pt-16 md:pt-24 pb-10 md:pb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral mb-4">
            One event. Two products.
          </p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink leading-tight max-w-[18ch]">
            A tablet photo booth and a guest photo wall, made for one night.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-graphite max-w-[60ch] leading-relaxed">
            TinyBooth is a free, no-account photo booth app for iPad and iPhone. TinyWall is a
            no-app QR photo wall your guests can post to from their phones. Pair them, brand them,
            and walk into the night with everything in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/app" variant="secondary">
              Get the booth app
            </CtaButton>
          </div>
          <p className="mt-6 text-sm text-graphite">
            Free for personal use. No credit card. No account.
          </p>
        </section>
      </Container>

      <Container>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 mb-4">
          <article className="rounded-3xl bg-cream/70 border border-stone p-8 hover:border-coral transition-colors">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral mb-3">
              The booth
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">TinyBooth, the app</h2>
            <p className="mt-3 text-graphite leading-relaxed">
              Tap, count down, take 4 photos, get a printable strip. Tablet-first so the iPad on a
              tripod feels right. AirPrint to a real printer. Save to the camera roll. Share to
              Instagram with a Polaroid-style card.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-graphite">
              <li>5 layouts: 1x4 classic, 2x2, 1x3, single, 1x6 double.</li>
              <li>Random message after each shot. The original 9 are still in.</li>
              <li>Free forever for standalone use.</li>
            </ul>
            <div className="mt-8">
              <CtaButton href="/app">Tour the app</CtaButton>
            </div>
          </article>
          <article className="rounded-3xl bg-cream/70 border border-stone p-8 hover:border-lilac transition-colors">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lilac mb-3">
              The wall
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">TinyWall, the photo wall</h2>
            <p className="mt-3 text-graphite leading-relaxed">
              Print one QR. Guests scan, snap, upload, and the photo appears on a TV in under two
              seconds. No app, no signup, no friction. Works on a Smart TV browser, Chromecast, or
              an HDMI laptop.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-graphite">
              <li>Free wall: 100 uploads, 7 days, live slideshow included.</li>
              <li>Pair with an event so booth strips and guest photos share branding.</li>
              <li>Bulk download as a zip when the night ends.</li>
            </ul>
            <div className="mt-8">
              <CtaButton href="/wall" variant="secondary">
                Tour the wall
              </CtaButton>
            </div>
          </article>
        </section>
      </Container>

      <Container>
        <Section
          eyebrow="Built for hosts who priced out a rental"
          heading="Photo booth rentals start at $550. They top out at $1,170 for a 360 booth. We are not that."
          lead="The DIY math: an iPad you already own, a $40 ring light, and a $129 Canon Selphy CP1500. Total all-in stays under $500 and you keep the gear after the night ends."
        >
          <FeatureGrid
            features={[
              {
                title: '$550 to $1,170',
                body: 'Average 3-hour photo booth rental in the US per Puddles Photo Booth, 2025. Open-air booths run $870, 360 booths $1,170, and add-ons push everything up by another $150 to $800.',
                eyebrow: 'The rental',
              },
              {
                title: '$300 to $500',
                body: 'A complete DIY stack: an iPad ($329 base), a stand, a ring light, a Selphy printer. All yours after the event. The first event pays the whole rig back.',
                eyebrow: 'The DIY',
              },
              {
                title: '$0 or $14.99',
                body: 'Free for personal use. $14.99 (in the app) or $12.99 (on the web) for a full Event Pass with branding, the wall, and a 60-day archive.',
                eyebrow: 'TinyBooth',
              },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section eyebrow="Inside the booth" heading="What the app does">
          <FeatureGrid features={APP_FEATURES} />
        </Section>
      </Container>

      <Container>
        <Section eyebrow="On the wall" heading="What the wall does">
          <FeatureGrid features={WALL_FEATURES} />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The unfair part"
          heading="One event, both products, one dashboard."
          lead="Set the colors and a logo once. They show up on the printed strip, the TV slideshow, and the Instagram-format share. Every guest photo and every booth strip lands in the same gallery you can download in one click."
        >
          <div className="flex flex-wrap gap-3">
            <CtaButton href="/events">See the event story</CtaButton>
            <CtaButton href="/pricing" variant="secondary">
              See pricing
            </CtaButton>
          </div>
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={HOMEPAGE_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Take a photo. Get a strip. That&apos;s the whole app.
          </h2>
          <p className="mt-4 text-graphite max-w-[60ch] mx-auto">
            Start a free wall in under a minute. Then download the booth on your iPad and pair them
            for the night.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/app" variant="secondary">
              Get the booth app
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
