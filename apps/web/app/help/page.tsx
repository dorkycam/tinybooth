import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  Faq,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { JsonLd, breadcrumbsSchema } from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'Help - TinyBooth',
  description:
    'How to set up TinyBooth at an event, troubleshoot AirPrint, run the TinyWall photo wall, manage your account, and understand photo retention.',
  alternates: { canonical: '/help' },
  openGraph: {
    title: 'Help - TinyBooth',
    description: 'Setup tips, AirPrint troubleshooting, retention and account info.',
    url: '/help',
  },
};

const APP_BASICS = [
  {
    question: 'How do I take a strip?',
    answer:
      'Open the app. Pick a layout (1x4 classic by default). Tap the shutter. The app counts down 3 seconds, takes a photo, shows a random message for half a second, counts down again. After 4 photos you see the strip. Tap Print, Save, or Share.',
  },
  {
    question: 'How do I change the layout?',
    answer:
      'Tap the small layout icon next to the shutter. The bottom sheet shows all 5 layouts: 1x4 classic, 2x2, 1x3, single, and 1x6 double. Your choice persists for the rest of the session.',
  },
  {
    question: 'Can I redo a strip?',
    answer:
      'Yes. On the preview screen, tap Redo. The app discards the current strip and starts a fresh shoot. You can also tap individual photos in the strip to reshoot just that frame.',
  },
  {
    question: 'Where do strips save?',
    answer:
      'To your camera roll automatically when you tap Save. The IG-format share is rendered separately so you have both a printable strip and a Story-shaped card.',
  },
] as const;

const EVENT_SETUP = [
  {
    question: 'How do I prep an iPad for a wedding?',
    answer: (
      <>
        Set the iPad on a tall light stand in portrait, plug it into the wall, turn off auto-lock
        (Settings &gt; Display &amp; Brightness &gt; Auto-Lock &gt; Never), and turn on Guided Access
        (Settings &gt; Accessibility &gt; Guided Access). Read the full setup at{' '}
        <Link href="/blog/how-to-set-up-an-ipad-photobooth-for-your-wedding" className="text-coral underline">
          How to set up an iPad photobooth for your wedding
        </Link>
        .
      </>
    ),
  },
  {
    question: 'What gear do I actually need?',
    answer:
      'iPad on a 7-foot light stand, ring light (14"), Canon Selphy CP1500 printer, a backdrop, and a power strip. Total all-in is $300 to $500 if you do not already own the iPad.',
  },
  {
    question: 'How long should the booth run?',
    answer:
      'Most weddings run the booth from cocktail hour through the first hour of the dance floor. Plan for 2 to 3 hours of active use plus 30 minutes of buffer at each end. Average wedding gets 70 to 100 strips.',
  },
] as const;

const PRINTING = [
  {
    question: 'How do I print to a Canon Selphy?',
    answer:
      'Connect the Selphy to the same Wi-Fi as the iPad. Open TinyBooth. Take a strip. Tap Print. Pick the Selphy from the AirPrint sheet. Pick the 4x6 sheet size. Tap Print.',
  },
  {
    question: 'My Selphy stalled after 8 prints. What now?',
    answer:
      'Known iOS issue. We wrap the print call in a 12-second timeout and surface a one-tap "restart printing" button when the queue stalls. Tap it once and the next strip prints.',
  },
  {
    question: 'Can I print 2x6 strips on a 4x6 Selphy?',
    answer:
      'Two strips fit on one 4x6 Selphy sheet. The default 1x4 classic strip is sized so you cut down the middle and get two strips per sheet. Use a paper trimmer for clean edges.',
  },
  {
    question: 'What other printers work?',
    answer: (
      <>
        Anything that supports AirPrint. We test on the Canon Selphy CP1500. The Selphy CP1300, the
        DNP DS-RX1HS, and most modern HP / Epson photo printers also work.{' '}
        <Link href="/blog/the-best-portable-photo-printer-for-photobooth-apps-in-2026" className="text-coral underline">
          See the printer guide
        </Link>
        .
      </>
    ),
  },
] as const;

const WALL = [
  {
    question: 'How do I create a wall?',
    answer: (
      <>
        Visit{' '}
        <Link href="/wall/new" className="text-coral underline">
          tinybooth.com/wall/new
        </Link>
        , type an event name, tap Create. You get a TV link and a QR code. Print the QR. Open the
        TV link on a Smart TV browser, AirPlay, or Chromecast.
      </>
    ),
  },
  {
    question: 'What if guests upload a video?',
    answer:
      'Free events accept photos only. Paid events accept short videos. The slideshow plays the first frame as a still and tags it with a small play icon.',
  },
  {
    question: 'How do I moderate uploads?',
    answer:
      'In the dashboard, open the event, toggle "approve before showing on the slideshow." New uploads land in the dashboard but stay off the TV until you tap Approve.',
  },
  {
    question: 'Can I use the wall without the booth?',
    answer:
      'Yes. The wall stands on its own. The booth + wall combo is the unique product, but using just the wall is a complete experience.',
  },
] as const;

const ACCOUNT = [
  {
    question: 'How do I delete my account?',
    answer: (
      <>
        Open the dashboard at{' '}
        <Link href="/dashboard/account" className="text-coral underline">
          tinybooth.com/dashboard/account
        </Link>
        , tap Delete account, confirm. Every event you own, every photo, every strip is removed
        within minutes. Or email hello@tinybooth.com and we process it within 30 days (CCPA / GDPR
        timelines).
      </>
    ),
  },
  {
    question: 'How do refunds work?',
    answer:
      'In-app purchases follow Apple and Google policies; we honor any refund the platforms issue. Web Stripe purchases: 14-day money back if the event has not happened yet. Email hello@tinybooth.com.',
  },
  {
    question: 'Why is the in-app price higher than web?',
    answer:
      'Apple and Google take 15 percent on in-app purchases (Small Business Program). The web price is the lower one because Stripe is cheaper for us. You pay the same product either way.',
  },
] as const;

const RETENTION = [
  {
    question: 'How long do photos stick around?',
    answer:
      'Free events: 7 days from the event date. Event Pass: 60 days. Event Pass Plus: 90 days. After retention, both the database row and the storage object are deleted by an hourly cron.',
  },
  {
    question: 'Can I extend retention on a free event?',
    answer:
      'Upgrade the event to Event Pass in the dashboard. Existing photos and strips carry over and the retention clock resets to the new tier.',
  },
  {
    question: 'How do I download everything before retention ends?',
    answer:
      'In the dashboard, open the event, tap Export. A zip URL generates within a minute and stays valid for 24 hours. Download once and it lives in your Google Drive forever.',
  },
  {
    question: 'What if I want my photos deleted now?',
    answer:
      'Delete the event from the dashboard. All photos, strips, and storage objects are removed within minutes. There is no soft-delete or recoverable trash.',
  },
] as const;

/**
 * /help — long help page. Five sections of real Q&A grouped by topic.
 * No FAQPage schema (Google retired the rich result for non-government /
 * non-health sites in 2023 per docs/research/seo.md), so the content
 * lives in clean `<dl>` markup instead.
 */
export default function HelpPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Help', path: '/help' },
        ])}
      />

      <Container size="prose">
        <Section eyebrow="Help" heading="The questions hosts actually ask.">
          <p className="text-graphite text-lg leading-relaxed">
            Set up at an event, troubleshoot AirPrint, run the wall, manage your account,
            understand retention. Email{' '}
            <a href="mailto:hello@tinybooth.com" className="text-coral underline">
              hello@tinybooth.com
            </a>{' '}
            if your question is not here.
          </p>
        </Section>

        <Section eyebrow="The booth app" heading="" tight>
          <Faq items={APP_BASICS} heading="TinyBooth app basics" />
        </Section>

        <Section tight>
          <Faq items={EVENT_SETUP} heading="Setting up at an event" />
        </Section>

        <Section tight>
          <Faq items={PRINTING} heading="Printing" />
        </Section>

        <Section tight>
          <Faq items={WALL} heading="TinyWall (the photo wall)" />
        </Section>

        <Section tight>
          <Faq items={ACCOUNT} heading="Account + billing" />
        </Section>

        <Section tight>
          <Faq items={RETENTION} heading="Photo retention + deletion" />
        </Section>
      </Container>
    </MarketingShell>
  );
}
