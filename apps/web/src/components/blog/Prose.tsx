import type { ReactNode } from 'react';

interface ProseProps {
  children: ReactNode;
}

/**
 * Long-form typography wrapper for blog posts. Provides default styling
 * for headings, paragraphs, lists, code, and links. Tailwind classes
 * intentionally inlined (no @tailwindcss/typography plugin) so the bundle
 * stays small and the marketing site does not pull in extra css.
 */
export function Prose({ children }: ProseProps): JSX.Element {
  return (
    <div
      className="
        text-graphite text-lg leading-relaxed
        [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-ink [&>h2]:mt-12 [&>h2]:mb-4
        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-ink [&>h3]:mt-10 [&>h3]:mb-3
        [&>p]:my-5
        [&>ul]:my-5 [&>ul]:pl-6 [&>ul>li]:list-disc [&>ul>li]:mb-2
        [&>ol]:my-5 [&>ol]:pl-6 [&>ol>li]:list-decimal [&>ol>li]:mb-2
        [&_a]:text-coral [&_a]:underline hover:[&_a]:text-ink
        [&>blockquote]:border-l-4 [&>blockquote]:border-coral [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:my-6 [&>blockquote]:text-ink
        [&_code]:bg-cream [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-ink
        [&>figure]:my-8
        [&>figure>img]:rounded-2xl [&>figure>img]:border [&>figure>img]:border-stone
        [&>figure>figcaption]:mt-2 [&>figure>figcaption]:text-sm [&>figure>figcaption]:text-graphite [&>figure>figcaption]:text-center
        [&>hr]:border-t [&>hr]:border-stone [&>hr]:my-12
      "
    >
      {children}
    </div>
  );
}
