import type { Metadata } from 'next';
import {
  Container,
  CtaButton,
  Faq,
  FeatureGrid,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { PlatformHero } from '../../src/components/marketing';
import { JsonLd, breadcrumbsSchema } from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'Events - one host, both products, one dashboard - TinyBooth',
  description:
    'TinyBooth events tie the photo booth app and the guest photo wall to one host, one brand, one dashboard. Booth strips and guest uploads share the same colors and land in the same gallery.',
  alternates: { canonical: '/events' },
  keywords: [
    'event photo booth app',
    'event photo collection',
    'wedding photo collection app',
    'corporate event photo collection',
  ],
  openGraph: {
    title: 'Events - one host, both products, one dashboard',
    description: 'How TinyBooth ties the booth app and the photo wall together with shared branding.',
    url: '/events',
  },
};

const EVENT_FAQ = [
  {
    question: 'Do I need an event to use the booth?',
    answer:
      'No. The booth runs standalone with no account and no event. Photos save to the camera roll and never leave your device. An event is only needed when you want shared branding, the wall, the dashboard, or cloud archive.',
  },
  {
    question: 'How do I connect the booth to an event?',
    answer:
      'Sign in to the dashboard. Open the event you want to connect. The dashboard shows a host-only QR code. Scan it with the booth app on the iPad. The booth is now tagged to that event for the night.',
  },
  {
    question: 'Can multiple iPads run the same event?',
    answer:
      'Yes. Sign in to the same event on each iPad. Strips from every device land in the same gallery, with the same branding.',
  },
  {
    question: 'What happens to event data when the event ends?',
    answer:
      'Free events: 7 days. Event Pass: 60 days. Event Pass Plus: 90 days. After retention, photos are removed from R2 and the database. Bulk export from the dashboard at any point during retention to keep them forever.',
  },
] as const;

/**
 * Inline SVG diagram for the event flow. No third-party renderer; the SVG
 * is the diagram. Accessible: title + desc inside the SVG plus an aria
 * description on the wrapping figure.
 */
function EventDiagram(): JSX.Element {
  return (
    <figure
      aria-label="Diagram showing the booth and the wall connecting to one event, then to one dashboard"
      className="rounded-3xl bg-cream/60 border border-stone p-6 md:p-10"
    >
      <svg
        viewBox="0 0 720 380"
        role="img"
        aria-labelledby="event-diagram-title event-diagram-desc"
        className="w-full h-auto"
      >
        <title id="event-diagram-title">TinyBooth event flow</title>
        <desc id="event-diagram-desc">
          The booth app and the photo wall both feed into a single event. The event powers shared
          branding and feeds the dashboard.
        </desc>
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
            <path d="M0 0 L10 5 L0 10 Z" fill="#1F2937" />
          </marker>
        </defs>

        <rect x="40" y="40" width="180" height="100" rx="20" fill="#F4EAD8" stroke="#1F2937" strokeWidth="2" />
        <text x="130" y="80" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1F2937">
          TinyBooth
        </text>
        <text x="130" y="105" textAnchor="middle" fontSize="13" fill="#5B6470">
          The app
        </text>
        <text x="130" y="123" textAnchor="middle" fontSize="11" fill="#5B6470">
          Posed strips, prints
        </text>

        <rect x="40" y="240" width="180" height="100" rx="20" fill="#F4EAD8" stroke="#1F2937" strokeWidth="2" />
        <text x="130" y="280" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1F2937">
          TinyWall
        </text>
        <text x="130" y="305" textAnchor="middle" fontSize="13" fill="#5B6470">
          The wall
        </text>
        <text x="130" y="323" textAnchor="middle" fontSize="11" fill="#5B6470">
          Guest QR uploads
        </text>

        <rect x="290" y="140" width="180" height="100" rx="20" fill="#E85D5D" stroke="#1F2937" strokeWidth="2" />
        <text x="380" y="180" textAnchor="middle" fontSize="18" fontWeight="700" fill="#FBF7EE">
          One event
        </text>
        <text x="380" y="205" textAnchor="middle" fontSize="13" fill="#FBF7EE">
          Branding + retention
        </text>
        <text x="380" y="223" textAnchor="middle" fontSize="11" fill="#FBF7EE">
          Logo, colors, dates
        </text>

        <rect x="540" y="140" width="160" height="100" rx="20" fill="#B488D6" stroke="#1F2937" strokeWidth="2" />
        <text x="620" y="180" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1F2937">
          Dashboard
        </text>
        <text x="620" y="205" textAnchor="middle" fontSize="13" fill="#1F2937">
          Photos + exports
        </text>
        <text x="620" y="223" textAnchor="middle" fontSize="11" fill="#1F2937">
          One zip download
        </text>

        <line x1="220" y1="90" x2="290" y2="170" stroke="#1F2937" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="220" y1="290" x2="290" y2="210" stroke="#1F2937" strokeWidth="2" markerEnd="url(#arrow)" />
        <line x1="470" y1="190" x2="540" y2="190" stroke="#1F2937" strokeWidth="2" markerEnd="url(#arrow)" />
      </svg>
      <figcaption className="mt-4 text-sm text-graphite text-center">
        Booth strips and guest uploads share branding and land in the same dashboard.
      </figcaption>
    </figure>
  );
}

/**
 * /events — the cross-product story page. Explains how booth + wall +
 * branding + dashboard fit together. Targets the "event photo" search
 * cluster but is also internally linked from every product page.
 */
export default function EventsPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Events', path: '/events' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Events"
          title="One event. Both products. One dashboard."
          lead="An event in TinyBooth is the unit that ties the booth and the wall together. Set the colors and a logo once. They show up on every printed strip, on the TV slideshow, and on the Instagram-format share. Every photo lands in the same dashboard, ready to download."
          primaryCta={{ href: '/wall/new', label: 'Start a free event' }}
          secondaryCta={{ href: '/pricing', label: 'See pricing' }}
        />
      </Container>

      <Container>
        <Section eyebrow="The diagram" heading="How it fits together.">
          <EventDiagram />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="What an event includes"
          heading="The shared layer."
        >
          <FeatureGrid
            features={[
              { title: 'Branding', body: 'Custom logo + brand colors. Applied to printed strips, the TV slideshow, the IG-format share, and the guest upload page.' },
              { title: 'Retention', body: 'Per-event photo lifetime. 7 days free, 60 days Event Pass, 90 days Event Pass Plus. Photos and storage objects are deleted past the window by an hourly cron.' },
              { title: 'Guest cap', body: 'TinyWall upload limit. 100 free, 150 Event Pass, unlimited Event Pass Plus.' },
              { title: 'Email + SMS', body: 'Quotas tracked per event. 50 sends on Event Pass, 250 on Event Pass Plus. Used by the booth strip-delivery flow.' },
              { title: 'Custom messages', body: 'Add up to 50 of your own one-liners to the random message pool. Event Pass Plus only.' },
              { title: 'Bulk export', body: 'One zip URL with every booth strip and every guest upload. Available on every paid event.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The connect step"
          heading="How the booth links to an event."
          lead="Sign in to the dashboard. Open the event. Scan the host-only QR with the booth on your iPad. The booth uploads strips into the same gallery as the wall for the rest of the night."
        >
          <FeatureGrid
            features={[
              { title: '1. Sign in', body: 'Apple, Google, or email magic link. No passwords. Apple Sign-In is the iPad default.' },
              { title: '2. Create the event', body: 'Set name, date, optional logo, optional colors. Free events stay anonymous if you want.' },
              { title: '3. Scan the host QR', body: 'The dashboard shows a one-time QR. Scan with the booth app. The booth tags every strip with the event id.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={EVENT_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            One night. One brand. Both products.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free event</CtaButton>
            <CtaButton href="/pricing" variant="secondary">
              See pricing
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
