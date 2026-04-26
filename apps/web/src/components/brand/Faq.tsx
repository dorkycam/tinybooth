import type { ReactNode } from 'react';

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

interface FaqProps {
  items: readonly FaqItem[];
  heading?: string;
}

/**
 * FAQ block. Renders as `<dl>` so screen readers + scrapers parse it as a
 * definition list (which Google still understands as Q&A even without
 * FAQPage rich-result schema, which we deliberately skip per the SEO doc).
 */
export function Faq({ items, heading = 'Common questions' }: FaqProps): JSX.Element {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ink mb-6">{heading}</h2>
      <dl className="divide-y divide-stone border-y border-stone">
        {items.map((item) => (
          <div key={item.question} className="py-5">
            <dt className="text-base font-semibold text-ink">{item.question}</dt>
            <dd className="mt-2 text-sm text-graphite leading-relaxed">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
