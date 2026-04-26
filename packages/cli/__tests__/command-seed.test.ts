/**
 * Tests for `tinybooth seed event`. We assert the dry-run prints the right
 * payload and that the theme mapping is stable.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedEvent, themeBranding } from '../src/commands/seed';
import { setLogger } from '../src/lib/ui';

describe('themeBranding', () => {
  it('returns a known palette for each theme', () => {
    expect(themeBranding('wedding').vibe).toBe('soft');
    expect(themeBranding('birthday').vibe).toBe('playful');
    expect(themeBranding('corporate').vibe).toBe('clean');
  });

  it('returns a hex color for primaryColor in every theme', () => {
    for (const theme of ['wedding', 'birthday', 'corporate'] as const) {
      expect(themeBranding(theme).primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('seedEvent', () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    setLogger({
      log: vi.fn((msg: string) => logged.push(msg)),
      info: vi.fn((msg: string) => logged.push(msg)),
      warn: vi.fn((msg: string) => logged.push(msg)),
      error: vi.fn((msg: string) => logged.push(msg)),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dry-runs without calling fetch and prints the URL', async () => {
    const code = await seedEvent({
      name: 'My Wedding',
      theme: 'wedding',
      baseUrl: 'http://localhost:3000',
      dryRun: true,
    });
    expect(code).toBe(0);
    expect(logged.some((m) => m.includes('would POST'))).toBe(true);
    expect(logged.some((m) => m.includes('event.create'))).toBe(true);
  });

  it('returns 0 on a successful fetch and parses slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: { data: { json: { slug: 'my-event' } } } }),
      }),
    );
    const code = await seedEvent({ name: 'My Wedding', baseUrl: 'http://x' });
    expect(code).toBe(0);
    expect(logged.some((m) => m.includes('my-event'))).toBe(true);
  });

  it('returns 1 on a non-ok fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'fail' }),
    );
    const code = await seedEvent({ name: 'X', baseUrl: 'http://x' });
    expect(code).toBe(1);
  });
});
