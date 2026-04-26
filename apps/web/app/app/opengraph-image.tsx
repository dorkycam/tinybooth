import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';
export const alt = 'TinyBooth - the photo booth app for iPad and iPhone';

/**
 * Per-route OpenGraph image for /app and its sub-routes. Cream background,
 * coral accent, app-specific copy.
 */
export default function AppOpengraphImage(): Response {
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
          backgroundColor: '#F4EAD8',
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
            color: '#E85D5D',
            marginBottom: 14,
          }}
        >
          TinyBooth - the booth app
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
          Turn your iPad into a real photo booth.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            fontWeight: 500,
            color: '#5B6470',
          }}
        >
          Free, AirPrint, the random message after every shot.
        </div>
      </div>
    ),
    { ...size },
  );
}
