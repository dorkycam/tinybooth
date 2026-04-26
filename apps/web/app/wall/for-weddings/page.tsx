import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  CtaButton,
  Faq,
  FeatureGrid,
  MarketingShell,
  Section,
} from '../../../src/components/brand';
import { PlatformHero } from '../../../src/components/marketing';
import {
  JsonLd,
  breadcrumbsSchema,
  softwareApplicationSchema,
} from '../../../src/components/seo';

export const metadata: Metadata = {
  title: 'Wedding photo wall - QR code photo sharing - TinyWall',
  description:
    'A no-app wedding photo wall. Print one QR code, guests scan, photos appear on the TV in seconds. Free tier holds 100 uploads. Replaces wedding hashtags and dead apps like WedPics.',
  alternates: { canonical: '/wall/for-weddings' },
  keywords: [
    'wedding photo wall',
    'qr code for wedding photos',
    'wedding qr code for photos',
    'wedding photo sharing app',
    'wedding guest photo app',
    'live wedding photo wall',
    'free wedding photo sharing app',
  ],
  openGraph: {
    title: 'Wedding photo wall - TinyWall',
    description: 'A no-app wedding photo wall. Guests scan a QR, the TV updates in seconds.',
    url: '/wall/for-weddings',
  },
};

const WEDDING_WALL_FAQ = [
  {
    question: 'How many photos do weddings actually get?',
    answer:
      'The Knot reported their Guest app averaged 870 photos per wedding before they shut it down. Real Knot forum quotes range from 200 to 850. Plan around 3 to 5 photos per attending guest.',
  },
  {
    question: 'Will my parents and grandparents figure it out?',
    answer:
      'Yes. The most-quoted endorsement on the Knot is "even my grandma figured it out." iOS 11 and Android 8 both have native QR scanning in the camera. No download, no app, no account.',
  },
  {
    question: 'Where should the QR code go?',
    answer: (
      <>
        Print one large QR sign at the entrance, plus 3 to 5 table cards.{' '}
        <Link href="/blog/qr-code-photo-upload-how-to-set-it-up-at-your-party-in-5-minutes" className="text-coral underline">
          See the 5-minute setup guide
        </Link>
        .
      </>
    ),
  },
  {
    question: 'How long do we get to keep the photos?',
    answer:
      'Event Pass keeps photos available for 60 days. Event Pass Plus is 90. Bulk export to a zip from the dashboard at any point in that window. Free events are 7 days, which is enough if you grab the zip the next morning.',
  },
  {
    question: 'What if a drunk uncle uploads something weird?',
    answer:
      'Toggle "approve before showing on the slideshow" in event settings. Photos still land in the dashboard. Nothing reaches the TV until you approve it. Most events do not need this; we hear about an actual incident maybe once a year across hundreds of weddings.',
  },
] as const;

/**
 * /wall/for-weddings — wedding-vertical landing for TinyWall. Targets the
 * highest-intent wedding-photo-wall cluster from the SEO research. Heavy
 * on the candid-photo angle plus the dead-WedPics safety story.
 */
export default function WeddingWallPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Wall', path: '/wall' },
          { name: 'For weddings', path: '/wall/for-weddings' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Wedding photo wall"
          title="A QR code on every table. 850 photos in your hand by Sunday."
          lead="Wedding hashtags died. WedPics shut down. The Knot retired Guest. The good news is the playbook that actually works is simple: one QR code, no app, photos on the TV in seconds. Free tier covers small weddings. $14.99 covers everything bigger."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/pricing', label: 'See pricing' }}
          microcopy="Free events keep 100 uploads for 7 days. Event Pass at $14.99 raises the cap to 150 with custom branding."
        />
      </Container>

      <Container>
        <Section
          eyebrow="The candid-photo problem"
          heading="The photographer cannot be everywhere."
          lead="Couples on the Knot, WeddingWire, and Reddit say the same thing about the candid photos guests took: the cousin's photo of grandma crying, the bridal party laughing in the corner of the patio, the moment the dance floor opened. The pro photographer missed half of it. The wall catches the rest."
        >
          <FeatureGrid
            features={[
              { title: '870 photos', body: 'Per wedding average from The Knot Guest app data before it shut down. Real Knot forum threads report 200 to 850 uploads.' },
              { title: 'Zero downloads', body: 'Guests open the QR with the iOS or Android camera. No App Store, no Play Store, no account.' },
              { title: 'Live on the TV', body: 'Photos appear on the venue monitor in under 2 seconds via Supabase Realtime. No casting hardware required.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The wedding-day setup"
          heading="What the wall actually looks like at a real wedding."
        >
          <FeatureGrid
            features={[
              { title: 'Entrance sign', body: 'A 5x7 framed card with the QR and a one-line caption. Hosts on the Knot say this is where 60 percent of uploads come from.' },
              { title: 'Table tents', body: 'Print one per table. Pair with the dinner program. Cards keep getting picked up across the night.' },
              { title: 'TV at the bar', body: 'Run the wall slideshow on a TV near the bar. Guests scan, take a photo, look up to see it land. The room reacts and uploads spike.' },
              { title: 'Branded landing', body: 'The guest upload page picks up your event colors and the couple\'s names. Feels like part of the wedding, not a third-party tool.' },
              { title: 'Optional caption', body: 'Guests can add a one-line caption. Most do not. The photo is the point.' },
              { title: 'Bulk download Sunday', body: 'Tap Export in the dashboard. Get a zip URL. Everything in your Google Drive by Sunday morning.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Why TinyWall over the alternatives"
          heading="Honest differences."
        >
          <FeatureGrid
            features={[
              { title: 'vs Kululu', body: 'Same no-app pattern. Bigger free tier (100 uploads vs 50). The booth + wall bundle is unique to us.' },
              { title: 'vs Pixelparty', body: 'Same hammered "no app" message. We add the booth, the IG-share render, and a 100-upload free tier (Pixelparty has none).' },
              { title: 'vs WedPics / The Guest', body: 'Both shut down. We have an active retention plus 24-hour-signed-zip export available the whole window.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions from couples">
          <Faq items={WEDDING_WALL_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            One QR, every guest, every angle.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/app/for-weddings" variant="secondary">
              Add the booth
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
