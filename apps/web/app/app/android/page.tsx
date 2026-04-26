import type { Metadata } from 'next';
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

const PLAY_STORE_URL = '#'; // TODO: replace with the live Play Store URL after Phase 6 submission.

export const metadata: Metadata = {
  title: 'Photo booth app for Android - TinyBooth',
  description:
    'TinyBooth on Android: a free photo booth app for Android tablets and phones. Five layouts, system print, and a no-app guest photo wall under one event.',
  alternates: { canonical: '/app/android' },
  keywords: [
    'android photo booth app',
    'photo booth app for android',
    'tablet photo booth app',
    'photo strip maker app',
  ],
  openGraph: {
    title: 'Photo booth app for Android - TinyBooth',
    description: 'A free photo booth app for Android tablets and phones. Tablet-first design, system print, no account.',
    url: '/app/android',
  },
};

const ANDROID_FAQ = [
  {
    question: 'Which Android versions are supported?',
    answer: 'Android 11 and up. The Camera2 API and the Print Framework cover everything from a Pixel 4a to a Galaxy Tab S9.',
  },
  {
    question: 'Will it print to my Selphy from Android?',
    answer: 'Yes, via Android Print Framework. Most Android versions surface the Selphy if it is on the same Wi-Fi. If not, install Canon Selphy Mobile, then re-open the print sheet.',
  },
  {
    question: 'Why is iOS more polished today?',
    answer: 'The original TinyBooth shipped on iOS in 2020. The Android version is built on the same Expo codebase as the new iOS app, so feature parity is the explicit goal, but the iOS path has had more wear in real events. Bugs we hear about land in the next OTA build.',
  },
  {
    question: 'How is the random message rendered?',
    answer: 'The same Caveat-handwritten overlay as iOS, sourced from the same library. Custom messages added in the dashboard show up across iOS and Android in real time.',
  },
] as const;

/**
 * /app/android. keyword landing page for "android photo booth app". The
 * page is honest about iOS being more battle-tested and explains the path
 * to parity. Tablets are the primary form factor; phones are secondary.
 */
export default function AndroidAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'Android', path: '/app/android' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Android photo booth"
          title="The photo booth app for Android tablets and phones."
          lead="Same booth, same layouts, same random message library. Tablet-first design with portrait orientation as the default. Pixel Tablet and Galaxy Tab S9 are the test devices."
          primaryCta={{ href: PLAY_STORE_URL, label: 'Get on Google Play', external: true }}
          secondaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          microcopy="Coming soon. Android 11 or later. Same bundle as iOS so future updates ship in lockstep."
        />
      </Container>

      <Container>
        <Section
          eyebrow="Why Android matters"
          heading="The market most photobooth apps abandoned."
          lead="Simple Booth, LumaBooth, Booth.Events, Pocketbooth, and Mini Photobooth are iPad-only. Skipping Android means leaving every Galaxy Tab and Pixel Tablet host without a real option. We did the work."
        >
          <FeatureGrid
            features={[
              {
                title: 'Galaxy Tab S9',
                body: 'Big AMOLED preview, fast camera. Pop it on a portrait stand and it reads as a booth from across the room.',
              },
              {
                title: 'Pixel Tablet',
                body: 'Cheaper than an iPad with a similar form factor. The included charging speaker dock keeps the booth alive for a full event.',
              },
              {
                title: 'Pixel 8 / S24',
                body: 'Phone backup mode. Works on any Android phone with a forward-facing camera and Android 11 or higher.',
              },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Print path"
          heading="System print on Android, with the same Selphy guidance as iOS."
        >
          <FeatureGrid
            features={[
              {
                title: 'Android Print Framework',
                body: 'The system print picker handles printer discovery. The Selphy CP1500 shows up automatically when both devices are on the same Wi-Fi.',
              },
              {
                title: 'Canon Selphy Mobile',
                body: 'On older Android versions, install the free Canon Selphy Mobile app to surface the printer. TinyBooth then prints through it.',
              },
              {
                title: 'Save and print later',
                body: 'When the venue Wi-Fi dies, save the strip to the gallery and print after the event. Strips never disappear from the device.',
              },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={ANDROID_FAQ} />
        </Section>
      </Container>
    </MarketingShell>
  );
}
