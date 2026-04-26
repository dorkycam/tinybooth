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
  title: 'Photo booth app for iPhone - TinyBooth',
  description:
    'TinyBooth on iPhone: a free photo booth app with five layouts, AirPrint, and a no-app guest photo wall. Pocket-sized booth that prints to a real printer.',
  alternates: { canonical: '/app/iphone' },
  keywords: [
    'iphone photo booth app',
    'best photobooth app for iphone',
    'photo booth app iphone',
    'photo strip maker app',
    '4 photo strip app',
  ],
  openGraph: {
    title: 'Photo booth app for iPhone - TinyBooth',
    description: 'A free photo booth app for iPhone. Take a strip, print to AirPrint, share to Stories.',
    url: '/app/iphone',
  },
};

const IPHONE_FAQ = [
  {
    question: 'Which iPhone works?',
    answer: 'Anything running iOS 16 or later. iPhone 11 and up handle the camera path with no perceived lag.',
  },
  {
    question: 'Can I run it as a real booth on the phone?',
    answer: 'You can. Use a phone tripod plus a Bluetooth shutter button so guests do not have to tap the screen between shots. The setup is smaller than the iPad rig, which matters for tight birthdays at home.',
  },
  {
    question: 'Will it print to my Selphy?',
    answer: (
      <>
        Yes, via AirPrint. Same setup as the iPad path.{' '}
        <Link href="/app/ipad" className="text-coral underline">
          See the iPad guide
        </Link>{' '}
        for the printer details.
      </>
    ),
  },
  {
    question: 'How is sharing different on iPhone?',
    answer: 'The Instagram-format share renders as a 1080x1920 Polaroid card and lands in the iOS share sheet. Tap Stories to post. The Caveat caption uses your event name when you have one set.',
  },
] as const;

/**
 * /app/iphone — keyword landing page targeting "iphone photo booth app".
 * Phones are the secondary form factor; this page is honest about that and
 * leans into the casual / pocket-booth use case.
 */
export default function IphoneAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'iPhone', path: '/app/iphone' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="iPhone photo booth"
          title="A pocket-sized photo booth that prints to a real printer."
          lead="The iPad is the canonical setup. The iPhone is the version you grab when there is no iPad in the house, when the booth has to fit on a coffee table, or when you want a strip from a casual hangout that did not need a stand."
          primaryCta={{ href: APP_STORE_URL, label: 'Download on the App Store', external: true }}
          secondaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          microcopy="Free for personal use. iOS 16 or later."
        />
      </Container>

      <Container>
        <Section
          eyebrow="When the phone makes sense"
          heading="Three places we actually recommend the iPhone over the iPad."
        >
          <FeatureGrid
            features={[
              {
                title: 'Casual hangouts',
                body: 'Friends over for dinner. No setup. Hand the phone around, get a strip, print it later from your camera roll if you want.',
              },
              {
                title: 'Tight indoor spaces',
                body: 'Apartments and small backyards where a 7-foot light stand does not fit. Set the phone on a 6-inch tripod, use a Bluetooth shutter, done.',
              },
              {
                title: 'Backup booth',
                body: 'When the iPad battery dies or the AirPrint connection drops, the iPhone is the quiet fallback. Same app, same layouts, same library of messages.',
              },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Recommended phone gear"
          heading="What we use when we run a phone booth."
        >
          <FeatureGrid
            features={[
              { title: 'A small tripod', body: 'Anything that holds a phone vertically about 4 feet up. The Manfrotto Pixi or a cheaper $15 alternative both work.' },
              { title: 'A Bluetooth shutter', body: 'Around $10. Lets guests trigger the countdown without tapping the screen. The countdown still runs the full 3 seconds.' },
              { title: 'A ring light (optional)', body: 'A 6" clip-on ring light is fine indoors. Skip if you have a big window during the day.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={IPHONE_FAQ} />
        </Section>
      </Container>
    </MarketingShell>
  );
}
