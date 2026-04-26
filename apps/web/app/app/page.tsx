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
  mobileApplicationSchema,
  softwareApplicationSchema,
} from '../../src/components/seo';

const APP_STORE_URL = 'https://apps.apple.com/us/app/tinybooth/id1519858905';
const PLAY_STORE_URL = '#'; // TODO: replace with the live Play Store URL after Phase 6 submission.

export const metadata: Metadata = {
  title: 'TinyBooth - the photo booth app for iPad and iPhone',
  description:
    'TinyBooth is a free photo booth app for iPad and iPhone. Five strip layouts, AirPrint, the random message library, and a no-app guest photo wall under one event.',
  alternates: { canonical: '/app' },
  openGraph: {
    title: 'TinyBooth - the free photo booth app',
    description:
      'A tablet-first photo booth app with AirPrint, five layouts, and a guest photo wall under one event.',
    url: '/app',
  },
};

const APP_HIGHLIGHTS = [
  { title: '1x4 classic strip', body: 'The default. Four photos stacked in a 2x6 strip, two strips per Selphy 4x6 sheet.' },
  { title: '2x2 grid', body: 'Square output for Polaroid-style 4x4 prints or social shares.' },
  { title: '1x3 strip', body: 'Three photos vertical for tighter prints when you only have room for a name and a date.' },
  { title: 'Single shot', body: '4x6 single. Best for portrait night with a backdrop and a ring light.' },
  { title: '1x6 double', body: 'Six-frame strip in two columns. Migrated from the original Swift output.' },
  { title: 'AirPrint', body: 'Tested against Canon Selphy CP1500. Print queue auto-recovers after the iOS print stall at 8 to 10 prints.' },
] as const;

const APP_FAQ = [
  {
    question: 'Is it really free?',
    answer:
      'Yes. The app is free to download and use. Standalone strips stay on your device with a small "tinybooth.com" wordmark in the corner. A one-time $1.99 Strip Unlock removes the wordmark from your most recent strip.',
  },
  {
    question: 'Do I need an account?',
    answer:
      'Not for solo use. You only need a Supabase-backed account if you want to host an event with custom branding, the dashboard, or the photo wall.',
  },
  {
    question: 'What printers does it work with?',
    answer: (
      <>
        Anything that supports AirPrint. We test on the Canon Selphy CP1500. The Selphy CP1300 and the
        DNP DS-RX1HS work too.{' '}
        <Link href="/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026" className="text-coral underline">
          Read the printer guide
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Where is the Android version?',
    answer:
      'Android shares the same Expo codebase as iOS and is in active build. Until then, the TinyWall guest experience already works on every Android phone with a browser.',
  },
] as const;

/**
 * /app — TinyBooth app product hub. Server-rendered. Pulls together the
 * five layouts, the AirPrint story, the random-message hook, and the
 * Instagram-format share angle into one page.
 */
export default function AppHubPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={mobileApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'App', path: '/app' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="The booth"
          title="Turn your iPad into a real photo booth."
          lead="Tap, count down, take 4 photos, get a printable strip. No account, no signup, no ads. Free for personal use, with the same 9 random messages from the original app."
          primaryCta={{ href: APP_STORE_URL, label: 'Download on the App Store', external: true }}
          secondaryCta={{ href: PLAY_STORE_URL, label: 'Get on Google Play', external: true }}
          microcopy="iOS available now. Android in active build."
        />
      </Container>

      <Container>
        <Section eyebrow="Layouts" heading="Five strip layouts that print clean.">
          <FeatureGrid features={APP_HIGHLIGHTS} />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The print path"
          heading="AirPrint, finally with a queue that does not stall."
          lead="Hosts mention the Canon Selphy queue stalling after 8 to 10 prints in basically every wedding-bee thread. We wrap the print call in a 12-second timeout and surface a one-tap restart so the iPad does not need a full power cycle mid-event."
        >
          <div className="flex flex-wrap gap-3">
            <CtaButton href="/app/ipad">Set up an iPad booth</CtaButton>
            <CtaButton href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding" variant="secondary">
              Read the setup guide
            </CtaButton>
          </div>
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="The brand-recognition lever"
          heading="Every shared strip ships in a Polaroid-style Instagram card."
          lead="When a guest shares the strip to their Stories, it lands as a 1080x1920 Polaroid card with the event caption in Caveat handwriting and a small TinyBooth wordmark at the bottom. Free distribution we earn back by not gating the wall."
        >
          <FeatureGrid
            features={[
              { title: 'Camera roll', body: 'Save the strip and the IG card as separate files. Both rendered locally.' },
              { title: 'Email + SMS delivery', body: '50 sends on Event Pass, 250 on Event Pass Plus. Quotas tracked per event.' },
              { title: 'Bulk export', body: 'Download every strip and every guest upload from the dashboard as a zip.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Pick your platform"
          heading="Landing pages tuned to the device you are setting up."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/app/ipad"
              className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors"
            >
              <h3 className="text-lg font-semibold text-ink">For iPad</h3>
              <p className="mt-2 text-sm text-graphite">Tablet-first. Portrait stand setup. Selphy printer guidance.</p>
            </Link>
            <Link
              href="/app/iphone"
              className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors"
            >
              <h3 className="text-lg font-semibold text-ink">For iPhone</h3>
              <p className="mt-2 text-sm text-graphite">When the iPad is unavailable. Selfie stick + Bluetooth shutter.</p>
            </Link>
            <Link
              href="/app/android"
              className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors"
            >
              <h3 className="text-lg font-semibold text-ink">For Android</h3>
              <p className="mt-2 text-sm text-graphite">Tablets and phones. Same booth, same layouts, same print path.</p>
            </Link>
          </div>
        </Section>
      </Container>

      <Container>
        <Section eyebrow="Built for the night" heading="Pick a vertical">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/app/for-weddings" className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors">
              <h3 className="text-lg font-semibold text-ink">Weddings</h3>
              <p className="mt-2 text-sm text-graphite">Event branding, the wall, and bulk export at $14.99 per night.</p>
            </Link>
            <Link href="/app/for-birthdays" className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors">
              <h3 className="text-lg font-semibold text-ink">Birthdays</h3>
              <p className="mt-2 text-sm text-graphite">Sweet sixteens to milestone birthdays. Free wall fits most.</p>
            </Link>
            <Link href="/app/for-corporate-events" className="rounded-2xl bg-cream/70 border border-stone p-6 hover:border-coral transition-colors">
              <h3 className="text-lg font-semibold text-ink">Corporate events</h3>
              <p className="mt-2 text-sm text-graphite">Logo on every strip, dashboard exports, AI moderation.</p>
            </Link>
          </div>
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={APP_FAQ} />
        </Section>
      </Container>
    </MarketingShell>
  );
}
