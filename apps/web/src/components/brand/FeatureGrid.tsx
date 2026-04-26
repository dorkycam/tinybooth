import type { ReactNode } from 'react';

export interface Feature {
  /** Headline. Keep it short. */
  title: string;
  /** One- or two-sentence body. */
  body: string;
  /** Optional eyebrow / category. */
  eyebrow?: string;
  /** Optional icon node rendered above the title. */
  icon?: ReactNode;
}

interface FeatureGridProps {
  features: readonly Feature[];
  /** Force three columns even on smaller breakpoints. */
  columns?: 2 | 3 | 4;
}

/**
 * Lightweight feature card grid. No icons by default to keep the visual
 * language quiet (per brand identity, no clipart).
 */
export function FeatureGrid({ features, columns = 3 }: FeatureGridProps): JSX.Element {
  const cols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }[columns];
  return (
    <ul className={`grid grid-cols-1 ${cols} gap-6`}>
      {features.map((f) => (
        <li
          key={f.title}
          className="rounded-2xl bg-cream/60 border border-stone p-6 hover:border-coral transition-colors"
        >
          {f.icon ? <div className="mb-3 text-coral">{f.icon}</div> : null}
          {f.eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-coral mb-2">
              {f.eyebrow}
            </p>
          ) : null}
          <h3 className="text-lg font-semibold text-ink">{f.title}</h3>
          <p className="mt-2 text-sm text-graphite leading-relaxed">{f.body}</p>
        </li>
      ))}
    </ul>
  );
}
