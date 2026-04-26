interface PlaceholderFigureProps {
  alt: string;
  /** Short caption shown under the figure. */
  caption?: string;
  /** Aspect ratio in width/height units. Defaults to 16/9. */
  ratio?: { w: number; h: number };
  /** Background tint inside the placeholder. */
  tone?: 'cream' | 'lilac' | 'coral';
}

/**
 * Placeholder figure for blog posts before real screenshots ship. Renders
 * an inline SVG with the alt text overlay so the post still has visual
 * structure. Camrynn drops in real `<Image>` components as screenshots
 * become available.
 */
export function PlaceholderFigure({
  alt,
  caption,
  ratio = { w: 16, h: 9 },
  tone = 'cream',
}: PlaceholderFigureProps): JSX.Element {
  const fill =
    tone === 'lilac' ? '#E8DBF1' : tone === 'coral' ? '#FAD3CD' : '#F4EAD8';
  return (
    <figure>
      <svg
        viewBox={`0 0 ${ratio.w * 80} ${ratio.h * 80}`}
        role="img"
        aria-label={alt}
        className="w-full h-auto rounded-2xl border border-stone"
      >
        <rect width="100%" height="100%" fill={fill} />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="22"
          fontWeight="600"
          fill="#5B6470"
        >
          {alt}
        </text>
      </svg>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
