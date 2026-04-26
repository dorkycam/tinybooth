import type { Metadata } from 'next';
import Link from 'next/link';
import {
  EVENT_PASS,
  EVENT_PASS_PLUS,
  STRIP_UNLOCK,
  type Product,
} from '@tinybooth/billing';
import {
  Container,
  CtaButton,
  Faq,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { PlatformHero } from '../../src/components/marketing';
import {
  JsonLd,
  breadcrumbsSchema,
  pricingProductSchema,
} from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'Pricing - free, $14.99 Event Pass, $39 Event Pass Plus - TinyBooth',
  description:
    'TinyBooth pricing: free for personal use, $14.99 Event Pass for one event with branding and the wall, $39 Event Pass Plus for unlimited guests, custom messages, and 90-day archive.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'TinyBooth pricing - free, $14.99 Event Pass, $39 Event Pass Plus',
    description: 'One-time per event. No subscription. Free tier is genuinely free.',
    url: '/pricing',
  },
};

/** Format USD cents as a currency string. */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface TierColumn {
  /** Display name. */
  name: string;
  /** Source product (null for the free tier). */
  product: Product | null;
  /** Free tier custom price label. */
  priceLabel: string;
  /** Subline. */
  priceCaption?: string;
  /** Bullet points for the tier. */
  features: readonly string[];
  /** CTA. */
  cta: { href: string; label: string };
  /** Highlighted (the recommended tier). */
  highlighted?: boolean;
}

/**
 * /pricing — comparison table fed from @tinybooth/billing so the catalog
 * stays in lockstep with the actual product. Web vs IAP price both shown
 * because they intentionally differ ($12.99 vs $14.99 for Event Pass) to
 * pass through Apple's 15% Small Business take.
 */
export default function PricingPage(): JSX.Element {
  const tiers: readonly TierColumn[] = [
    {
      name: 'Free',
      product: null,
      priceLabel: '$0',
      priceCaption: 'No card required',
      features: [
        'TinyBooth standalone, all 5 layouts',
        'Random message library (the original 9)',
        'AirPrint to any compatible printer',
        'Save to camera roll, share to Stories',
        'TinyWall: 100 uploads, 7-day retention, live slideshow included',
        'Small "tinybooth.com" wordmark on strips and the IG share',
      ],
      cta: { href: '/wall/new', label: 'Start a free wall' },
    },
    {
      name: EVENT_PASS.name,
      product: EVENT_PASS,
      priceLabel: formatPrice(EVENT_PASS.priceUsdCents.iap),
      priceCaption: `${formatPrice(EVENT_PASS.priceUsdCents.web)} on the web`,
      features: [
        'Everything in Free, plus:',
        'Custom event branding (logo + colors)',
        'Watermark removed on printed strips',
        'TinyWall guest cap raised to 150',
        '60-day photo archive (booth + wall)',
        '50 email or SMS strip deliveries',
        'Bulk export as a 24-hour signed zip',
        'Dashboard access for one event',
      ],
      cta: { href: '/dashboard', label: 'Buy in dashboard' },
      highlighted: true,
    },
    {
      name: EVENT_PASS_PLUS.name,
      product: EVENT_PASS_PLUS,
      priceLabel: formatPrice(EVENT_PASS_PLUS.priceUsdCents.iap),
      priceCaption: `${formatPrice(EVENT_PASS_PLUS.priceUsdCents.web)} on the web`,
      features: [
        'Everything in Event Pass, plus:',
        'Unlimited TinyWall guest uploads',
        '90-day photo archive',
        '250 email or SMS strip deliveries',
        'Custom random messages (add up to 50 of your own)',
        'Priority IG-share render',
      ],
      cta: { href: '/dashboard', label: 'Buy in dashboard' },
    },
  ];

  const stripUnlockNote = `Strip Unlock: ${formatPrice(STRIP_UNLOCK.priceUsdCents.iap)}, in-app purchase only. Removes the wordmark from your most recent standalone strip.`;

  const pricingFaq = [
    {
      question: 'Why is the in-app price higher than the web price?',
      answer:
        'Apple and Google take a 15 percent cut on in-app purchases under the Small Business Program. We pass that through. The web Stripe price is the lower number; the in-app price is what you see when you tap Upgrade on your iPad.',
    },
    {
      question: 'Is it really one-time per event?',
      answer:
        'Yes. No subscription. We picked consumable IAP on purpose because hosts run 1 to 4 events a year and hate the cancel-the-sub friction. A future "Pro Host" subscription is a year-2 idea, not a launch product.',
    },
    {
      question: 'Refunds?',
      answer:
        'In-app purchases follow Apple and Google refund policies; we honor any refund issued by either. Web Stripe charges: 14-day money back if the event has not happened yet. Email hello@tinybooth.com.',
    },
    {
      question: 'What if I just want to clean up one standalone strip?',
      answer:
        'The $1.99 Strip Unlock removes the wordmark from your most recent standalone strip. It is App Store / Play Store only because the web has no booth surface to take a photo on.',
    },
  ];

  const productOffers = [
    {
      name: EVENT_PASS.name,
      description: EVENT_PASS.description,
      priceCents: EVENT_PASS.priceUsdCents.iap,
      sku: EVENT_PASS.iosProductId,
    },
    {
      name: EVENT_PASS_PLUS.name,
      description: EVENT_PASS_PLUS.description,
      priceCents: EVENT_PASS_PLUS.priceUsdCents.iap,
      sku: EVENT_PASS_PLUS.iosProductId,
    },
    {
      name: STRIP_UNLOCK.name,
      description: STRIP_UNLOCK.description,
      priceCents: STRIP_UNLOCK.priceUsdCents.iap,
      sku: STRIP_UNLOCK.iosProductId,
    },
  ] as const;

  return (
    <MarketingShell>
      <JsonLd data={pricingProductSchema(productOffers)} />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />

      <Container>
        <PlatformHero
          eyebrow="Pricing"
          title="Free for personal use. $14.99 for an event with everything."
          lead="No subscription. One-time per event. The free tier is the actual product, not a 24-hour 10-photo demo. The paid tier exists so we can keep the lights on without a $99-per-month fee."
          primaryCta={{ href: '/wall/new', label: 'Start a free wall' }}
          secondaryCta={{ href: '/app', label: 'Get the app' }}
          microcopy="Free wall: 100 uploads, 7-day retention, live slideshow included."
        />
      </Container>

      <Container>
        <Section eyebrow="Compare tiers" heading="Pick the one that matches the night.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <article
                key={tier.name}
                className={`rounded-3xl border p-8 flex flex-col ${
                  tier.highlighted
                    ? 'bg-ink text-paper border-ink shadow-lg'
                    : 'bg-cream/60 border-stone'
                }`}
              >
                <header className="mb-5">
                  <h3 className={`text-xl font-bold ${tier.highlighted ? 'text-paper' : 'text-ink'}`}>
                    {tier.name}
                  </h3>
                  <p
                    className={`mt-2 text-3xl md:text-4xl font-bold ${
                      tier.highlighted ? 'text-coral' : 'text-ink'
                    }`}
                  >
                    {tier.priceLabel}
                  </p>
                  {tier.priceCaption ? (
                    <p
                      className={`mt-1 text-sm ${
                        tier.highlighted ? 'text-paper/70' : 'text-graphite'
                      }`}
                    >
                      {tier.priceCaption}
                    </p>
                  ) : null}
                </header>
                <ul
                  className={`flex-1 flex flex-col gap-2 text-sm ${
                    tier.highlighted ? 'text-paper/90' : 'text-graphite'
                  }`}
                >
                  {tier.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden className={tier.highlighted ? 'text-coral' : 'text-coral'}>
                        +
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href={tier.cta.href}
                    className={`inline-flex items-center justify-center rounded-full px-5 py-3 font-semibold transition-colors w-full ${
                      tier.highlighted
                        ? 'bg-coral text-paper hover:bg-paper hover:text-ink'
                        : 'bg-ink text-paper hover:bg-coral'
                    }`}
                  >
                    {tier.cta.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-graphite">{stripUnlockNote}</p>
        </Section>
      </Container>

      <Container size="prose">
        <Section eyebrow="Pricing questions">
          <Faq items={pricingFaq} />
        </Section>
      </Container>

      <Container>
        <Section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-ink">
            Free is free. Paid pays for one night.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <CtaButton href="/wall/new">Start a free wall</CtaButton>
            <CtaButton href="/dashboard" variant="secondary">
              Open the dashboard
            </CtaButton>
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
