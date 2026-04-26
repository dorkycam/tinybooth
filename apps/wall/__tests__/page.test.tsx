import { describe, expect, it } from 'vitest';

/**
 * Smoke test for the wall app. Confirms the brand token import resolves; the
 * Phase 1 work added Tailwind + the realtime helper and the upload state
 * machine, but the heavy integration test surface lives in the web package
 * (where the tRPC routers are unit-tested with mocked Prisma).
 */
describe('wall package', () => {
  it('exports the lilac sub-brand accent', async () => {
    const tokens = await import('@tinybooth/ui-tokens');
    expect(tokens.LIGHT_COLORS.lilac).toBe('#B488D6');
  });
});
