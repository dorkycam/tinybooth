import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  CtaButton,
  Faq,
  FeatureGrid,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { PlatformHero } from '../../src/components/marketing';
import {
  JsonLd,
  breadcrumbsSchema,
  softwareApplicationSchema,
} from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'TinyWall - the no-app guest photo wall for events',
  description:
    'TinyWall is a no-app QR code photo wall. Guests scan, snap, upload from their phones, and the photo lands on the TV in under two seconds. Free wall: 100 uploads, 7 days, live slideshow included.',
  alternates: { canonical: '/wall' },
  keywords: [
    'wedding photo wall',
    'qr code photo upload',
    'qr code for wedding photos',
    'wedding photo sharing app',
    'live photo slideshow for tv',
    'no app wedding photo sharing',
  ],
  openGraph: {
    title: 'TinyWall - the no-app guest photo wall',
    description: 'Print one QR. Guests scan, snap, upload, see it on the TV in two seconds.',
    url: '/wall',
  },
};

const WALL_FEATURES = [
  { title: 'No app, no account', body: 'Guests scan a QR, take a photo in their browser, and it lands on the TV. No install, no signup, no name field by default.' },
  { title: 'Live slideshow', body: 'Open the URL on a Smart TV browser, AirPlay from a laptop, or plug in a Chromecast. No special hardware required.' },
  { title: 'Free tier that is real', body: '100 uploads, 7-day retention, the live slideshow included. Beats Kululu (50) and crushes LiveShareNow (10 newest).' },
  { title: 'Pair with the booth', body: 'Connect a TinyBooth event so booth strips and guest uploads share branding and land in the same dashboard.' },
  { title: 'Bulk export', body: 'Download every photo as a zip from the dashboard. Available on every paid event.' },
  { title: 'Moderation toggle', body: 'Optional approve-before-show mode for events where you want to filter the slideshow.' },
] as const;

const WALL_FAQ = [
  {
    question: 'Do guests really not need an app?',
    answer: 'Correct. The QR code points to a URL on tinybooth.com. Their phone opens a tiny camera page in the browser. They take a photo, tap upload, done. We tested on iOS Safari and Chrome on Android.',
  },
  {
    question: 'How do I show the wall on a TV?',
    answer: (
      <>
        Three options. Open the wall URL in a Smart TV browser (most TVs from 2018+ support this), or AirPlay from a Mac, or plug in a Chromecast and cast a Chrome tab.{' '}
        <Link href="/wall/live-slideshow" className="text-coral underline">
          See the live slideshow setup guide
        </Link>
        .
      </>
    ),
  },
  {
    question: 'How long do the photos stick around?',
    answer: 'Free events: 7 days from the event date. Event Pass: 60 days. Event Pass Plus: 90 days. Bulk export from the dashboard at any point during retention so you keep them forever on your own.',
  },
  {
    question: 'Will guests upload weird stuff?',
    answer: 'In practice, no. Vendors with thousands of events report rare incidents. If you want a safety net, turn on "approve before showing on the slideshow" in the event settings. Photos still land in the dashboard so you can publish later.',
  },
  {
    question: 'What is the difference between this and Kululu or Pixelparty?',
    answer: (
      <>
        Bigger free tier (100 uploads vs Kululu&apos;s 50, 100 vs Pixelparty&apos;s no-free), live slideshow on every tier, and the only product that bundles a photo booth app with the wall under one event.{' '}
        <Link href="/blog/wedding-photo-wall-app-comparison-tinybooth-vs-pov-vs-kululu" className="text-coral underline">
          Read the full comparison
        </Link>
        .
      </>
    ),
  },
] as const;

/**
 * /wall. TinyWall product landing. Replaces the Phase 1 minimal page with
 * a real product story. The "Create a wall" CTA goes to /wall/new which
 * preserves the existing event-creation flow from Phase 1.
 */
export default function WallLandingPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Wall', path: '/wall' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="The wall"
          title="A guest photo wall that does not need an app."
          lead="Print one QR code. Guests scan, snap a photo in their phone browser, and it lands on the TV in under two seconds. No app, no account, no friction. The free tier holds 100 uploads for 7 days, with the live slideshow included."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/wall/for-weddings', label: 'For weddings' }}
          microcopy="Free events keep 100 uploads for 7 days. Paid events extend retention and unlock branding."
        />
      </Container>

      <Container>
        <Section eyebrow="What it does" heading="Six things that matter on the night.">
          <FeatureGrid features={WALL_FEATURES} />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The story"
          heading="Wedding hashtags died around 2020. Then WedPics shut down in 2019. The Knot retired Guest in 2022. We are the next thing."
          lead="Couples have been looking for a no-app, no-account, photos-you-keep replacement for years. The market is full of small players doing roughly the same thing. We win on the free tier, on the booth + wall bundle, and on actually shipping a print path."
        >
          <FeatureGrid
            features={[
              { title: 'Hashtags do not work', body: 'By the time the dance floor opens, most guests are refilling drinks, not remembering your hashtag. Public, algorithm-buried, fragmented across apps.' },
              { title: 'WedPics shut down', body: 'February 2019. Three weeks notice. Couples lost wedding memories. We do not delete an event without 60 to 90 days of advance retention plus 24-hour signed-zip export available the whole time.' },
              { title: 'The Guest retired', body: 'October 2022. The Knot pulled it. The market knows the demand exists. Smaller players are racing to fill the gap.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Make a wall in 60 seconds"
          heading="Ready to try it?"
          lead="No credit card. No account required. Get a TV link plus a QR code in one minute."
        >
          <div id="create" className="rounded-3xl bg-cream/60 border border-stone p-8">
            <p className="text-graphite mb-4">
              Free events keep 100 uploads for 7 days. Paid events upgrade in the dashboard.
            </p>
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
          </div>
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={WALL_FAQ} />
        </Section>
      </Container>
    </MarketingShell>
  );
}
