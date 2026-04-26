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
  title: 'Wedding photo booth app - TinyBooth',
  description:
    'A wedding photo booth app that costs $14.99 instead of $1,170. Five strip layouts, AirPrint to a Canon Selphy, custom event branding, and a guest photo wall.',
  alternates: { canonical: '/app/for-weddings' },
  keywords: [
    'photo booth app for wedding',
    'wedding photo booth app',
    'photo booth alternative wedding',
    'photo booth app for parties',
    'free photo booth app',
  ],
  openGraph: {
    title: 'Wedding photo booth app - TinyBooth',
    description: '$14.99 per wedding instead of $1,170 for a 360 booth rental. Free wall included.',
    url: '/app/for-weddings',
  },
};

const WEDDING_FAQ = [
  {
    question: 'How does $14.99 compare to a real rental?',
    answer:
      'Per Puddles Photo Booth 2025 data, the average 3-hour US rental is $550 to $1,170. A 360 booth averages $1,170. Add-ons push everything up another $150 to $800. Event Pass at $14.99 in the app or $12.99 on the web buys you the same custom-branded strips, the wall, the dashboard, and a 60-day archive.',
  },
  {
    question: 'Can I customize the strip with our names and date?',
    answer: 'Yes. Set the event branding once (logo + colors) in the dashboard. Every strip prints with your branding and the watermark removed. The TV slideshow uses the same colors so the booth and the wall look like one event.',
  },
  {
    question: 'What about photos from guests who never made it to the booth?',
    answer: (
      <>
        That is what TinyWall is for. Print one QR code, hang it next to the bar, and guests upload from their phones. No app to download.{' '}
        <Link href="/wall/for-weddings" className="text-coral underline">
          See the wedding wall page
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Will my photos disappear like WedPics did?',
    answer: 'No. Event Pass keeps photos for 60 days. Event Pass Plus is 90. You can bulk export as a zip from the dashboard at any point in that window. Free events keep photos for 7 days, which is plenty if you download the zip the next morning.',
  },
] as const;

/**
 * /app/for-weddings — wedding-vertical landing for the app. The angle is
 * the rent-vs-DIY math from the user research, plus the wall as the
 * candid-photo capture story. Targets "photo booth app for wedding".
 */
export default function WeddingAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'For weddings', path: '/app/for-weddings' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Wedding photo booth"
          title="A $14.99 wedding photo booth that prints. Plus a guest photo wall."
          lead="A 360 booth rental averages $1,170 for three hours. An iPad you already own, a $129 Canon Selphy, and a TinyBooth Event Pass total under $200 and you keep the gear. The night ends with branded strips and 200+ candid uploads from guest phones."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/pricing', label: 'See pricing' }}
          microcopy="$14.99 in the app or $12.99 on the web. One-time per event. No subscription."
        />
      </Container>

      <Container>
        <Section
          eyebrow="What an Event Pass actually unlocks"
          heading="Wedding-grade defaults out of the box."
        >
          <FeatureGrid
            features={[
              { title: 'Custom branding', body: 'Your names, your colors, your logo on every strip and on the TV slideshow.' },
              { title: 'TinyWall (150 guests)', body: 'A no-app guest photo wall. Print one QR, guests scan, photos hit the TV in under two seconds.' },
              { title: 'Email + SMS delivery', body: '50 sends. Capture a guest email at the booth, the strip arrives in their inbox after the event.' },
              { title: 'Bulk export', body: 'Download every strip and every guest upload as a zip. The dashboard pre-generates a 24-hour signed URL.' },
              { title: '60-day archive', body: 'Your photos stay accessible for 60 days, well past the time most couples are still posting.' },
              { title: 'Watermark removed', body: 'No "tinybooth.com" wordmark on printed strips for paid events. The IG-format share keeps a small mark since that is the brand-distribution channel.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The booth + the wall together"
          heading="Why couples want both."
          lead="The photographer cannot be everywhere. Multiple Knot forum posts hit the same note: 'so many candid angles we wouldn't have gotten,' typically 200 to 850 uploads from guests with their phones. The booth catches the posed photos. The wall catches the cousin's photo of grandma crying."
        >
          <FeatureGrid
            features={[
              { title: 'Booth strips', body: 'Posed shots in your event branding. Printed and shareable.' },
              { title: 'Guest uploads', body: 'Candids from phones. Live on the TV, archived in the dashboard.' },
              { title: 'One archive', body: 'Both feeds land in the same gallery. One download, all the photos.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions from couples">
          <Faq items={WEDDING_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            $14.99. One night. Both products.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/pricing" variant="secondary">
              See pricing
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
