import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
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

const APP_STORE_URL = 'https://apps.apple.com/us/app/tinybooth/id1519858905';

export const metadata: Metadata = {
  title: 'Photo booth app for iPad - TinyBooth',
  description:
    'TinyBooth is the free photo booth app for iPad. Tablet-first design, AirPrint, five strip layouts, and a no-app guest photo wall under one event.',
  alternates: { canonical: '/app/ipad' },
  keywords: [
    'photo booth app for ipad',
    'ipad photo booth app',
    'photo booth software for ipad',
    'free ipad photobooth',
    'tablet photo booth app',
  ],
  openGraph: {
    title: 'Photo booth app for iPad - TinyBooth',
    description: 'A tablet-first photo booth app for iPad. Free, AirPrint, no account.',
    url: '/app/ipad',
  },
};

const IPAD_FAQ = [
  {
    question: 'Which iPad models work?',
    answer: 'Anything running iPadOS 16 or later. iPad (10th gen) and up handle the camera path with no lag. The iPad Pro 12.9" gives the best preview at arm length.',
  },
  {
    question: 'Should I use portrait or landscape?',
    answer: 'Portrait. Hosts on Weddingbee and the WeddingWire DIY threads pretty much always set the iPad on a tall light stand in portrait so the strip output and the preview match. Landscape works fine, it just looks less booth-like.',
  },
  {
    question: 'Can guests escape the app?',
    answer: 'Turn on Guided Access (Settings > Accessibility > Guided Access). Hold the Home or Side button three times to lock the iPad into TinyBooth for the night. Press the same combo with your passcode to exit.',
  },
  {
    question: 'How do I print to a Canon Selphy?',
    answer: (
      <>
        Connect the Selphy to the same Wi-Fi as the iPad, tap Print, pick the Selphy from the AirPrint sheet. We auto-restart the print queue if iOS stalls it after 8 to 10 prints.{' '}
        <Link href="/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026" className="text-coral underline">
          Read the printer guide
        </Link>
        .
      </>
    ),
  },
] as const;

/**
 * /app/ipad. keyword landing page targeting "photo booth app for iPad".
 * Tablet-first sensibility per the plan: portrait orientation, ring light,
 * Guided Access, Selphy printer setup.
 */
export default function IpadAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'iPad', path: '/app/ipad' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="iPad photo booth"
          title="The photo booth app for iPad, built for the way iPads actually get used."
          lead="Most photo booth apps treat the iPad as a delivery mechanism for a desktop UI. TinyBooth is portrait-first, propped-up-on-a-tripod first, ring-light first. It assumes you have one operator and 150 people walking up tipsy."
          primaryCta={{ href: APP_STORE_URL, label: 'Download on the App Store', external: true }}
          secondaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          microcopy="Free for personal use. iPadOS 16 or later."
        />
      </Container>

      <Container>
        <Section
          eyebrow="The setup"
          heading="What you actually need to run an iPad booth at a wedding."
          lead="The DIY iPad booth is now a category, and it works. Here is the rig that shows up in every successful Weddingbee thread."
        >
          <FeatureGrid
            features={[
              {
                title: 'iPad in portrait',
                body: 'iPad (10th gen) or newer. Portrait orientation matches the strip output. Lock the screen in Settings so it does not flip mid-shoot.',
              },
              {
                title: 'Tall light stand',
                body: 'A 7-foot light stand with a tablet mount runs about $35 on Amazon. Eye-level for adults; tall enough that kids cluster underneath rather than block.',
              },
              {
                title: 'A ring light',
                body: 'A 14" ring light in the $40 to $60 range. Wedding venues are dim and tungsten. Without one, every strip looks muddy.',
              },
              {
                title: 'Canon Selphy CP1500',
                body: 'About $129. Dye-sublimation, AirPrint, 4x6 sheets that cut into two 2x6 strips. The Wifibooth forum favorite.',
              },
              {
                title: 'A backdrop',
                body: 'A $30 fabric backdrop or a curtain you already own. Solid colors photograph cleaner than busy patterns.',
              },
              {
                title: 'A power strip',
                body: 'iPad needs to stay plugged in for a 5-hour event. So does the Selphy. Run them off one strip you can hide.',
              },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The app on iPad"
          heading="What changes when you set it up on the bigger screen."
        >
          <FeatureGrid
            features={[
              {
                title: 'Bigger preview',
                body: 'The full preview takes the screen edge to edge. Guests see exactly what they look like before the countdown starts.',
              },
              {
                title: 'Bigger countdown',
                body: 'A 3-second countdown that reads from across a banquet hall. Optional silent mode for ceremonies in progress.',
              },
              {
                title: 'Bigger random message',
                body: 'After every photo, a Caveat-handwritten line lands on the screen. Migrated 9 messages from the original app, plus your own custom ones on Event Pass Plus.',
              },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={IPAD_FAQ} />
        </Section>
      </Container>
    </MarketingShell>
  );
}
