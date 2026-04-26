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
  title: 'Birthday party photo booth app - TinyBooth',
  description:
    'A photo booth app for birthday parties. Free for personal use, five strip layouts, the random message after every photo, and a free guest photo wall.',
  alternates: { canonical: '/app/for-birthdays' },
  keywords: [
    'photo booth app birthday party',
    'photo booth app graduation',
    'photo booth app baby shower',
    'birthday party photo app',
    'sweet 16 photo booth',
  ],
  openGraph: {
    title: 'Birthday party photo booth app - TinyBooth',
    description: 'Free photo booth app for birthday parties. Print strips, share to Stories, post to a free wall.',
    url: '/app/for-birthdays',
  },
};

const BIRTHDAY_FAQ = [
  {
    question: 'Do I need to pay for a small birthday?',
    answer: 'No. The booth is free for personal use. The free wall holds 100 uploads for 7 days, which covers most birthday parties under 50 people. Pay only if you want custom branding or you are running something larger.',
  },
  {
    question: 'How is this different from the camera app?',
    answer: 'It runs the 4-photo booth flow, with a 3-second countdown between shots, a random message after each shot, and a printable strip at the end. The camera app does not do any of that.',
  },
  {
    question: 'Can the kids use it without breaking everything?',
    answer: (
      <>
        Yes. Turn on iOS Guided Access (Settings &gt; Accessibility &gt; Guided Access) to lock the iPad into TinyBooth.{' '}
        <Link href="/app/ipad" className="text-coral underline">
          See the iPad setup guide
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Can I add my own messages for a sweet sixteen?',
    answer: 'Yes, with Event Pass Plus ($39 in the app, $34 on the web). Add up to 50 of your own one-liners to the random message pool for the event.',
  },
] as const;

/**
 * /app/for-birthdays. birthday-vertical landing for the app. Lower-key
 * tone than the wedding page. Free is enough for most. Targets "photo
 * booth app birthday party" plus the long-tail birthday cluster.
 */
export default function BirthdayAppPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
          { name: 'For birthdays', path: '/app/for-birthdays' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Birthday photo booth"
          title="A free photo booth app for the next birthday."
          lead="Sweet sixteens, milestone birthdays, kids parties. Set an iPad on a tripod, set the layout once, and the night runs itself. Strips print to any AirPrint printer. The free wall covers most parties under 50 people."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/app', label: 'Get the app' }}
          microcopy="Free for personal use. No account required."
        />
      </Container>

      <Container>
        <Section
          eyebrow="The defaults that work for most birthdays"
          heading="Set it up once. Walk away."
        >
          <FeatureGrid
            features={[
              { title: '2x2 grid', body: 'Square output that fits everyone in frame. Best for group shots at the cake table.' },
              { title: 'Front camera', body: 'Default. Selfie-style preview so guests can see exactly what the photo will look like.' },
              { title: 'No-account mode', body: 'Skip the sign-in entirely. Everything stays on the device.' },
              { title: 'Random message', body: 'After every shot. The original 9 messages are still in. Custom additions on Event Pass Plus.' },
              { title: 'AirPrint', body: 'Tap Print, pick the printer, the strip drops in 12 seconds.' },
              { title: 'Free wall (optional)', body: 'Print one QR, guests upload from their phones, photos hit the TV in seconds.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="When a paid event makes sense"
          heading="Three reasons to upgrade for a bigger birthday."
        >
          <FeatureGrid
            features={[
              { title: 'Sweet sixteen with branding', body: 'Custom colors, the birthday theme on every strip, the wall in the same colors. Event Pass at $14.99.' },
              { title: 'Milestone birthday', body: 'Bigger guest count. Event Pass Plus removes the cap and adds custom random messages so the inside jokes show up between shots.' },
              { title: 'You want everything in one place', body: 'The dashboard ties booth strips and guest uploads together so one download captures the whole night.' },
            ]}
          />
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={BIRTHDAY_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Set the iPad. Pick a layout. Done.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/app" variant="secondary">
              Get the app
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
