import type { ReactNode } from 'react';
import { CtaButton } from '../brand/CtaButton';

interface PlatformHeroProps {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  primaryCta: { href: string; label: string; external?: boolean };
  secondaryCta?: { href: string; label: string; external?: boolean };
  /** Optional small text rendered under the buttons. */
  microcopy?: string;
}

/**
 * Reusable hero for landing pages (per-platform, per-vertical). Keeps the
 * H1, lead, and CTA pattern consistent so SEO and visual rhythm match.
 */
export function PlatformHero(props: PlatformHeroProps): JSX.Element {
  return (
    <section className="pt-16 md:pt-24 pb-12 md:pb-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral mb-4">
        {props.eyebrow}
      </p>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-tight max-w-[24ch]">
        {props.title}
      </h1>
      <p className="mt-6 text-lg md:text-xl text-graphite max-w-[60ch] leading-relaxed">
        {props.lead}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <CtaButton href={props.primaryCta.href} external={props.primaryCta.external}>
          {props.primaryCta.label}
        </CtaButton>
        {props.secondaryCta ? (
          <CtaButton
            href={props.secondaryCta.href}
            external={props.secondaryCta.external}
            variant="secondary"
          >
            {props.secondaryCta.label}
          </CtaButton>
        ) : null}
      </div>
      {props.microcopy ? (
        <p className="mt-5 text-sm text-graphite">{props.microcopy}</p>
      ) : null}
    </section>
  );
}
