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
  title: 'Corporate event photo booth app - TinyBooth',
  description:
    'A photo booth app for corporate events, conferences, and brand activations. Custom logo on every strip, dashboard exports, content moderation, and a no-app guest photo wall.',
  alternates: { canonical: '/app/for-corporate-events' },
  keywords: [
    'photo booth app corporate event',
    'event photo booth app',
    'corporate event photo collection',
    'photo booth app with branding',
    'photo booth app with logo',
  ],
  openGraph: {
    title: 'Corporate event photo booth app - TinyBooth',
    description: 'Branded photo strips and a no-app guest wall for corporate events. $39 per event.',
    url: '/app/for-corporate-events',
  },
};

const CORPORATE_FAQ = [
  {
    question: 'Can I put our logo on every strip?',
    answer: 'Yes. Upload a PNG logo in the dashboard. Pick brand colors. Every strip and every wall slideshow uses them. The watermark is removed for paid events.',
  },
  {
    question: 'Can we moderate guest uploads?',
    answer: 'Yes. Toggle "approve before showing on the slideshow" in the event settings. Uploads land in the dashboard but stay off the TV until you tap Approve.',
  },
  {
    question: 'How do we get the photos at the end?',
    answer: 'Bulk export from the dashboard. The export endpoint generates a 24-hour signed zip URL. Download once, share with the marketing team, done.',
  },
  {
    question: 'Can multiple iPads run the same event?',
    answer: (
      <>
        Yes, by signing in to the same event on each iPad. The dashboard treats them as one event so all strips land together.{' '}
        <Link href="/events" className="text-coral underline">
          Read more about how events work
        </Link>
        .
      </>
    ),
  },
] as const;

/**
 * /app/for-corporate-events. corporate-vertical landing. The story is
 * branding + moderation + bulk export. Targets the lower-volume but
 * higher-intent corporate keyword cluster from the SEO research.
 */
export default function CorporateAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'For corporate events', path: '/app/for-corporate-events' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Corporate event photo booth"
          title="A branded photo booth and a guest photo wall, in your event colors."
          lead="Conferences, holiday parties, brand activations, customer dinners. Logo on every strip. Custom colors on the slideshow. Dashboard with bulk export and per-photo moderation. $39 for a full event with everything turned on."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/pricing', label: 'See pricing' }}
          microcopy="Event Pass Plus at $39 in the app or $34 on the web. One-time per event."
        />
      </Container>

      <Container>
        <Section
          eyebrow="What corporate hosts actually need"
          heading="Built around the brand-team checklist."
        >
          <FeatureGrid
            features={[
              { title: 'Logo on every strip', body: 'Upload a PNG logo in the dashboard. Picks up the brand colors automatically when you set them.' },
              { title: 'Custom event colors', body: 'Set primary and accent colors. Used on the printed strip border and the TV slideshow background.' },
              { title: 'Pre-approval moderation', body: 'Optional. Photos land in the dashboard immediately but stay off the TV until you tap Approve.' },
              { title: 'Bulk export', body: 'One download, every strip and every guest upload. 24-hour signed zip URL.' },
              { title: 'Custom random messages', body: 'Add up to 50 brand-safe one-liners to the random message pool. The booth pulls from your library plus the originals.' },
              { title: '90-day archive', body: 'Photos stay accessible for 90 days. Plenty of time for the marketing team to schedule socials.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The wall for corporate"
          heading="One QR code. No app for guests. The marketing team gets every photo."
          lead="The wall lets attendees post from their phones with no install or account. The dashboard exports everything. AI moderation toggle is a one-tap setting if you are nervous about the room."
        >
          <FeatureGrid
            features={[
              { title: 'No app for guests', body: 'Print one QR. Scan, snap, upload, on the TV in two seconds. Works on every phone with a browser.' },
              { title: 'Live slideshow', body: 'Smart TV browser, AirPlay, Chromecast, or HDMI laptop. Run on the venue\'s monitor without extra hardware.' },
              { title: 'Branded landing page', body: 'The guest upload page picks up your event colors and logo so the experience feels like part of the brand.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions from event marketers">
          <Faq items={CORPORATE_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            $39. One event. Both products. Logo on everything.
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
