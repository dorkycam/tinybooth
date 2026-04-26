import { LIGHT_COLORS } from '@tinybooth/ui-tokens';

/**
 * Phase 0 placeholder homepage. The real marketing site lands in Phase 5.
 * This exists to confirm the workspace import and font wiring work end-to-end.
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
      <h1 style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5, margin: 0 }}>tinybooth</h1>
      <p style={{ marginTop: 12, color: LIGHT_COLORS.coral, fontSize: 20 }}>
        A small, sharp photobooth app and a no-app guest photo wall.
      </p>
    </main>
  );
}
