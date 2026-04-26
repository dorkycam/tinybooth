import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Container,
  MarketingShell,
} from '../../../src/components/brand';
import { Prose } from '../../../src/components/blog';
import {
  JsonLd,
  articleSchema,
  breadcrumbsSchema,
} from '../../../src/components/seo';
import { allPostSlugs, postBySlug, relatedPosts } from '../../../src/lib/blog';

interface PageProps {
  params: { slug: string };
}

/** Pre-render a static page for every known post slug at build time. */
export function generateStaticParams(): { slug: string }[] {
  return allPostSlugs().map((slug) => ({ slug }));
}

/** Per-post metadata. Reads frontmatter from the post module. */
export function generateMetadata({ params }: PageProps): Metadata {
  const post = postBySlug(params.slug);
  if (!post) return { title: 'Not found' };
  return {
    title: post.meta.title,
    description: post.meta.description,
    keywords: [...post.meta.keywords],
    alternates: { canonical: `/blog/${post.meta.slug}` },
    openGraph: {
      type: 'article',
      title: post.meta.title,
      description: post.meta.description,
      url: `/blog/${post.meta.slug}`,
      publishedTime: post.meta.date,
      modifiedTime: post.meta.updated ?? post.meta.date,
      authors: [post.meta.author ?? 'Camrynn Dilley'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta.title,
      description: post.meta.description,
    },
  };
}

/** Format an ISO date as "Month D, YYYY". */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * /blog/[slug]. post template. Renders the post body inside Prose, plus
 * Article + BreadcrumbList JSON-LD, plus a related-posts footer.
 */
export default function BlogPostPage({ params }: PageProps): JSX.Element {
  const post = postBySlug(params.slug);
  if (!post) {
    notFound();
  }
  const Body = post.Body;
  const related = relatedPosts(post.meta.slug, 3);
  return (
    <MarketingShell>
      <JsonLd
        data={articleSchema({
          title: post.meta.title,
          description: post.meta.description,
          slug: post.meta.slug,
          datePublished: post.meta.date,
          dateModified: post.meta.updated ?? post.meta.date,
          authorName: post.meta.author,
          imageUrl: post.meta.heroImageUrl,
        })}
      />
      <JsonLd
        data={breadcrumbsSchema([
          { name: 'TinyBooth', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.meta.title, path: `/blog/${post.meta.slug}` },
        ])}
      />

      <Container size="prose">
        <article className="py-12 md:py-16">
          <header className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral mb-3">
              <Link href="/blog" className="hover:text-ink">
                Blog
              </Link>{' '}
              · {formatDate(post.meta.date)}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              {post.meta.title}
            </h1>
            <p className="mt-5 text-lg text-graphite leading-relaxed">{post.meta.description}</p>
          </header>

          <div
            aria-hidden
            className="w-full aspect-[16/9] rounded-2xl bg-cream border border-stone mb-10 flex items-center justify-center"
          >
            <span className="text-sm text-graphite px-6 text-center">
              {post.meta.heroImageAlt}
            </span>
          </div>

          <Prose>
            <Body />
          </Prose>

          <footer className="mt-16 border-t border-stone pt-8">
            <p className="text-sm text-graphite">
              Written by {post.meta.author ?? 'Camrynn Dilley'}. Last updated{' '}
              {formatDate(post.meta.updated ?? post.meta.date)}.
            </p>
          </footer>
        </article>

        {related.length > 0 ? (
          <section className="py-10 border-t border-stone">
            <h2 className="text-2xl font-bold text-ink mb-6">More on the blog</h2>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((r) => (
                <li key={r.meta.slug}>
                  <Link
                    href={`/blog/${r.meta.slug}`}
                    className="block rounded-2xl border border-stone p-5 hover:border-coral transition-colors"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral mb-2">
                      {formatDate(r.meta.date)}
                    </p>
                    <h3 className="text-base font-bold text-ink leading-snug">{r.meta.title}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>
    </MarketingShell>
  );
}
