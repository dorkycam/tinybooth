import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';
export const alt = 'TinyBooth pricing - free, $14.99 Event Pass, $39 Event Pass Plus';

/**
 * Per-route OpenGraph image for /pricing. Carbon background, Coral accent,
 * three-tier headline.
 */
export default function PricingOpengraphImage(): Response {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          backgroundColor: '#1F2937',
          color: '#FBF7EE',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: '#FF7A6B',
            marginBottom: 14,
          }}
        >
          TinyBooth pricing
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          Free. $14.99. $39.
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.9,
          }}
        >
          One-time per event. No subscription. Free is genuinely free.
        </div>
      </div>
    ),
    { ...size },
  );
}
