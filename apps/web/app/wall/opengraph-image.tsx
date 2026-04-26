import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';
export const alt = 'TinyWall - the no-app guest photo wall for events';

/**
 * Per-route OpenGraph image for /wall and its sub-routes. Lilac accent
 * (the TinyWall sub-brand color) with the no-app pitch.
 */
export default function WallOpengraphImage(): Response {
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
          backgroundColor: '#FBF7EE',
          color: '#1F2937',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: 'uppercase',
            color: '#B488D6',
            marginBottom: 14,
          }}
        >
          TinyWall by TinyBooth
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
          }}
        >
          A guest photo wall that does not need an app.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            fontWeight: 500,
            color: '#5B6470',
          }}
        >
          One QR. Live on the TV in two seconds. Free tier of 100 uploads.
        </div>
      </div>
    ),
    { ...size },
  );
}
