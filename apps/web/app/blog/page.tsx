import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  MarketingShell,
  Section,
} from '../../src/components/brand';
import { JsonLd, breadcrumbsSchema } from '../../src/components/seo';
import { ALL_POSTS } from '../../src/lib/blog';

export const metadata: Metadata = {
  title: 'Blog - TinyBooth',
  description:
    'Long-form posts about photo booths, wedding photo walls, AirPrint troubleshooting, the rent-vs-DIY math, and the death of WedPics.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog - TinyBooth',
    description: 'Long-form posts on photobooth setup, photo walls, and event photography.',
    url: '/blog',
  },
};

/**
 * Format an ISO date as "Month D, YYYY" (en-US).
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * /blog. index page. Lists every post with title, excerpt, and date.
 * Hero image placeholder sits at the top of each card; Camrynn replaces
 * the alt text + the file once real screenshots ship.
 */
export default function BlogIndexPage(): JSX.Element {
  return (
    <MarketingShell>
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Blog', path: '/blog' },
        ])}
      />

      <Container>
        <Section eyebrow="Blog" heading="Long-form posts on photo booths and photo walls.">
          <p className="text-lg text-graphite max-w-[60ch]">
            Setup guides, printer reviews, the rent-vs-DIY math, and a few opinions about why
            wedding hashtags died and what replaced them.
          </p>
        </Section>
      </Container>

      <Container>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">
          {ALL_POSTS.map((post) => (
            <li key={post.meta.slug}>
              <Link
                href={`/blog/${post.meta.slug}`}
                className="block rounded-3xl bg-cream/60 border border-stone p-6 hover:border-coral transition-colors h-full"
              >
                <div
                  aria-hidden
                  className="w-full aspect-[16/9] rounded-2xl bg-paper border border-stone mb-5 flex items-center justify-center"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite">
                    {post.meta.heroImageAlt}
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral mb-2">
                  {formatDate(post.meta.date)}
                </p>
                <h2 className="text-xl font-bold text-ink leading-tight">{post.meta.title}</h2>
                <p className="mt-3 text-graphite text-sm leading-relaxed">
                  {post.meta.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </MarketingShell>
  );
}
