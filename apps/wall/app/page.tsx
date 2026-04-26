import { LIGHT_COLORS } from '@tinybooth/ui-tokens';

/**
 * Phase 0 placeholder for the TinyWall app shell. The Phase 1 work moves the
 * existing TinyWall code from `tinybooth-wall/` into here, swaps Apollo for
 * tRPC, and adds Supabase Realtime for the slideshow.
 */
export default function HomePage(): JSX.Element {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: LIGHT_COLORS.paper,
        color: LIGHT_COLORS.ink,
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, margin: 0 }}>
        tinywall
      </h1>
      <p style={{ marginTop: 12, color: LIGHT_COLORS.lilac, fontSize: 20 }}>by tinybooth</p>
    </main>
  );
}
