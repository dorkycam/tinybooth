import type { Metadata } from 'next';
import {
  Container,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { ContactForm } from '../../src/components/marketing/ContactForm';
import { JsonLd, breadcrumbsSchema } from '../../src/components/seo';

export const metadata: Metadata = {
  title: 'Contact - TinyBooth',
  description:
    'Get in touch with TinyBooth. Email hello@tinybooth.com or use the form. We reply within 24 hours.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact - TinyBooth',
    description: 'Email hello@tinybooth.com or send a quick note.',
    url: '/contact',
  },
};

/**
 * /contact. short page. Email + a simple form. The form POSTs to
 * /api/contact which logs in dev and sends via SES when configured.
 */
export default function ContactPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />

      <Container size="prose">
        <Section eyebrow="Contact" heading="Say hi.">
          <p className="text-graphite text-lg leading-relaxed">
            Email{' '}
            <a href="mailto:hello@tinybooth.com" className="text-coral underline">
              hello@tinybooth.com
            </a>{' '}
            for anything. Question, bug report, feature request, story from your wedding. I
            (Camrynn) read everything and reply within 24 hours.
          </p>
          <p className="mt-3 text-graphite text-lg leading-relaxed">
            For account or billing issues, include the event slug or the email tied to your
            dashboard so I can look it up faster.
          </p>

          <div className="mt-10 rounded-3xl bg-cream/60 border border-stone p-8">
            <h2 className="text-xl font-bold text-ink mb-2">Quick form</h2>
            <p className="text-sm text-graphite mb-6">
              Same destination as the email. Use whichever is easier.
            </p>
            <ContactForm />
          </div>
        </Section>
      </Container>
    </MarketingShell>
  );
}
