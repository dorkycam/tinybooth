/**
 * `tinybooth seed event <name> [--theme=<theme>]` -- seed a demo event by
 * calling the `event.create` tRPC mutation against a configured base URL.
 * Useful for building demos, screenshot recordings, or smoke-testing a
 * brand-new prod environment.
 */
import { error, info, note, success } from '../lib/ui.js';

/** Themes the seed command knows how to apply. */
export type SeedTheme = 'wedding' | 'birthday' | 'corporate';

/** Flags accepted by `tinybooth seed event`. */
export interface SeedFlags {
  /** Event name. */
  name: string;
  /** Optional theme to apply. */
  theme?: SeedTheme;
  /** Base URL for the tRPC call. Defaults to the env var, else localhost. */
  baseUrl?: string;
  /** When true, log without executing. */
  dryRun?: boolean;
}

/**
 * Map a theme name to the branding payload the dashboard expects. Mirrors
 * the shape used by `apps/web/src/components/dashboard/tabs/BrandingTab.tsx`.
 */
export function themeBranding(theme: SeedTheme): {
  primaryColor: string;
  accentColor: string;
  vibe: string;
} {
  switch (theme) {
    case 'wedding':
      return { primaryColor: '#1f2937', accentColor: '#f5d0c5', vibe: 'soft' };
    case 'birthday':
      return { primaryColor: '#fb7185', accentColor: '#fde68a', vibe: 'playful' };
    case 'corporate':
      return { primaryColor: '#1e3a8a', accentColor: '#e2e8f0', vibe: 'clean' };
  }
}

/** Default base URL (env or localhost). */
function defaultBaseUrl(): string {
  return process.env.TINYBOOTH_API_BASE_URL ?? 'http://localhost:3000';
}

/** Run the seed command. */
export async function seedEvent(flags: SeedFlags): Promise<number> {
  const dryRun = flags.dryRun === true;
  const baseUrl = flags.baseUrl ?? defaultBaseUrl();
  const branding = flags.theme !== undefined ? themeBranding(flags.theme) : null;
  const url = `${baseUrl}/api/trpc/event.create`;
  const body = {
    json: {
      name: flags.name,
      branding: branding ?? {},
    },
  };

  info(`Seeding event "${flags.name}" against ${baseUrl}.`);
  if (branding !== null) info(`Theme: ${flags.theme} (${branding.vibe}).`);

  if (dryRun) {
    note(`would POST ${url}`);
    note(`would send body ${JSON.stringify(body)}`);
    return 0;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    error(`Seed failed: ${response.status} ${response.statusText}`);
    return 1;
  }
  const json = (await response.json()) as { result?: { data?: { json?: { slug?: string } } } };
  const slug = json.result?.data?.json?.slug ?? '(no slug returned)';
  success(`Seeded event ${slug}.`);
  return 0;
}
