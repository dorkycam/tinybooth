import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';
export const alt = 'TinyBooth - tablet photo booth app + party photo wall';

/**
 * Default OpenGraph image for the marketing root. Coral background, large
 * Manrope wordmark, sub-line. Generated via @vercel/og at build / on the
 * edge so we do not ship a 700KB PNG by hand.
 */
export default function OpengraphImage(): Response {
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
          backgroundColor: '#E85D5D',
          color: '#FBF7EE',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: 0.85,
            marginBottom: 16,
          }}
        >
          tinybooth
        </div>
        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          A tablet photo booth and a guest photo wall.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.92,
          }}
        >
          One event. Both products.
        </div>
      </div>
    ),
    { ...size },
  );
}
