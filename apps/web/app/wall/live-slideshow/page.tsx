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
  title: 'Live photo slideshow on a TV - TinyWall',
  description:
    'A live photo slideshow that runs on any TV with a browser. AirPlay from a Mac, plug a Chromecast in, or open the URL on a Smart TV. Guests scan a QR and photos hit the screen in two seconds.',
  alternates: { canonical: '/wall/live-slideshow' },
  keywords: [
    'live photo slideshow for tv',
    'live photo wall for events',
    'reception slideshow app',
    'wedding slideshow app',
    'display photos on tv at party',
    'live photo upload tv',
    'qr code photo wall',
  ],
  openGraph: {
    title: 'Live photo slideshow on a TV - TinyWall',
    description: 'Run a live photo slideshow on a venue TV. Smart TV, AirPlay, Chromecast, or laptop.',
    url: '/wall/live-slideshow',
  },
};

const SLIDESHOW_FAQ = [
  {
    question: 'What is the lag from upload to TV?',
    answer:
      'About 1 to 2 seconds in real-world events. We use Supabase Realtime (Postgres CDC channels) so the TV pushes new photos as they hit the database. The old TinyWall used 3-second polling; the new one is push-based.',
  },
  {
    question: 'Will it work on my Smart TV?',
    answer:
      'Most Smart TVs from 2018+ have a built-in browser. Open tinybooth.com/wall/your-event-slug, full-screen, leave it. Confirmed working on LG webOS, Samsung Tizen, and Google TV browsers.',
  },
  {
    question: 'What if the venue does not have a Smart TV?',
    answer: (
      <>
        Plug an HDMI cable into a laptop and run the slideshow tab full-screen. Or use a $30
        Chromecast and cast the tab from any laptop.{' '}
        <Link href="/blog/qr-code-photo-upload-how-to-set-it-up-at-your-party-in-5-minutes" className="text-coral underline">
          See the 5-minute setup
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Does the slideshow include booth strips?',
    answer:
      'When you connect a TinyBooth booth to the same event, yes. Strips and guest uploads alternate on the same TV with shared event branding.',
  },
  {
    question: 'What if the wifi dies?',
    answer:
      'The slideshow caches the last 50 photos and keeps cycling them until the connection comes back. New uploads queue on the guest devices and post when network resumes.',
  },
] as const;

/**
 * /wall/live-slideshow. informational landing for the "live photo
 * slideshow for tv" keyword cluster. Lots of practical setup instructions,
 * three setup paths (Smart TV, AirPlay, Chromecast / HDMI laptop).
 */
export default function LiveSlideshowPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Wall', path: '/wall' },
          { name: 'Live slideshow', path: '/wall/live-slideshow' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Live slideshow"
          title="A live photo slideshow on any TV with a browser."
          lead="Open the wall URL on a Smart TV browser, AirPlay from a Mac, or plug in a $30 Chromecast. Guest uploads land on the screen in 1 to 2 seconds. No special hardware. No casting fees."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/wall', label: 'About TinyWall' }}
          microcopy="Live slideshow included on every tier, free included."
        />
      </Container>

      <Container>
        <Section
          eyebrow="Three setup paths"
          heading="Pick the one that matches the room."
        >
          <FeatureGrid
            features={[
              {
                title: 'Smart TV browser',
                body: 'Most TVs from 2018+ have a built-in web browser. Open tinybooth.com/wall/your-event-slug, full-screen, walk away. Confirmed on LG webOS, Samsung Tizen, and Google TV.',
                eyebrow: 'Easiest',
              },
              {
                title: 'AirPlay from a Mac',
                body: 'Open the wall URL in Safari on your laptop, AirPlay to an Apple TV connected to the venue display. Works on AirPlay 2 receivers and Apple TVs from 2015 on.',
                eyebrow: 'For mac users',
              },
              {
                title: 'Chromecast or HDMI',
                body: 'Plug in a $30 Chromecast and cast a Chrome tab. Or run an HDMI cable from a laptop. Both work on any TV with an HDMI input.',
                eyebrow: 'Cheapest backup',
              },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Slideshow defaults"
          heading="What you see on the TV out of the box."
        >
          <FeatureGrid
            features={[
              { title: 'Photo + caption', body: 'Each photo holds for 5 seconds. Optional caption renders in the bottom corner if the guest wrote one.' },
              { title: 'Event branding', body: 'When you set custom colors and a logo, the slideshow background and corner mark match your event. Free tier uses the warm Paper background.' },
              { title: 'QR overlay', body: 'A small QR in the corner so guests who walk into the room mid-event can still scan and join.' },
              { title: 'Reverse-chrono', body: 'Newest photos first. Old photos cycle in the loop after the new ones run.' },
              { title: 'Auto-recover', body: 'If the venue Wi-Fi drops, the slideshow keeps cycling cached photos. New uploads queue and post when the network is back.' },
              { title: 'Booth strips inline', body: 'When you connect a TinyBooth event, printed-style strip renders alternate with guest uploads on the same TV.' },
            ]}
          />
        </Section>
      </Container>

      <Container>
        <Section
          eyebrow="Performance"
          heading="The push-based realtime, not the old polling pattern."
          lead="The original TinyWall polled every 3 seconds. The new one uses Supabase Realtime over Postgres CDC channels. New photos go from the upload route into the slideshow with one network hop. Real-world lag is 1 to 2 seconds."
        />
      </Container>

      <Container size="prose">
        <Section eyebrow="Questions">
          <Faq items={SLIDESHOW_FAQ} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Print one QR. Open one URL on the TV. Done.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/wall" variant="secondary">
              About TinyWall
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
