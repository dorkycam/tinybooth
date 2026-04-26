/**
 * Commander program definition for `@tinybooth/cli`. The entry file (`index.ts`)
 * just builds this and calls `parseAsync`. Tests import `buildProgram` and
 * inspect the configured commands without running anything.
 */
import { Command } from 'commander';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deploy } from './commands/deploy.js';
import { doctor } from './commands/doctor.js';
import { envCommand } from './commands/env.js';
import { logs as logsCmd } from './commands/logs.js';
import { migrate } from './commands/migrate.js';
import { release } from './commands/release.js';
import { seedEvent } from './commands/seed.js';
import { setup } from './commands/setup.js';
import type { EnvAction, EnvTarget } from './commands/env.js';
import type { LogsService } from './commands/logs.js';
import type { ReleasePlatform, ReleaseTrack } from './commands/release.js';
import type { SeedTheme } from './commands/seed.js';

/** Resolve the repo root from `import.meta.url`. */
export function detectRepoRoot(): string {
  // src/program.ts lives at packages/cli/src/program.ts, so up four levels.
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', '..', '..');
}

/** Build (but don't execute) the commander program. */
export function buildProgram(repoRoot: string = detectRepoRoot()): Command {
  const program = new Command();
  program
    .name('tinybooth')
    .description('TinyBooth single-binary CLI: setup, deploy, migrate, release, env, logs, seed.')
    .version('0.0.0');

  program
    .command('doctor')
    .description('Check that every required CLI is installed and authed.')
    .option('--dry-run', 'log what would be checked instead of doing it', false)
    .action(async (opts: { dryRun: boolean }) => {
      const code = await doctor({ dryRun: opts.dryRun });
      process.exitCode = code;
    });

  program
    .command('setup')
    .description('Interactive bootstrap of every account and provider integration.')
    .option('--dry-run', 'log every action without executing', false)
    .action(async (opts: { dryRun: boolean }) => {
      const code = await setup({ dryRun: opts.dryRun, repoRoot });
      process.exitCode = code;
    });

  program
    .command('deploy')
    .description('Run quality gate then deploy apps/web and apps/wall to Vercel.')
    .option('--staging', 'deploy to a preview alias instead of production', false)
    .option('--skip-quality', 'skip turbo lint/typecheck/test/build (NOT RECOMMENDED)', false)
    .option('--dry-run', 'log every command without executing', false)
    .action(async (opts: { staging: boolean; skipQuality: boolean; dryRun: boolean }) => {
      const code = await deploy({
        staging: opts.staging,
        skipQuality: opts.skipQuality,
        dryRun: opts.dryRun,
        repoRoot,
      });
      process.exitCode = code;
    });

  program
    .command('migrate')
    .description('Apply pending Prisma migrations against the active DATABASE_URL.')
    .option('--check', 'exit non-zero if there are unapplied migrations (CI mode)', false)
    .option('--dry-run', 'log without executing', false)
    .action(async (opts: { check: boolean; dryRun: boolean }) => {
      const code = await migrate({ check: opts.check, dryRun: opts.dryRun, repoRoot });
      process.exitCode = code;
    });

  const seed = program.command('seed').description('Seed demo data.');
  seed
    .command('event <name>')
    .description('Seed an event (with optional theme).')
    .option('--theme <theme>', 'one of wedding | birthday | corporate')
    .option('--base-url <url>', 'override the API base URL')
    .option('--dry-run', 'log without executing', false)
    .action(async (
      name: string,
      opts: { theme?: string; baseUrl?: string; dryRun: boolean },
    ) => {
      const theme = parseTheme(opts.theme);
      const code = await seedEvent({
        name,
        theme,
        baseUrl: opts.baseUrl,
        dryRun: opts.dryRun,
      });
      process.exitCode = code;
    });

  const env = program.command('env').description('Manage Vercel env vars.');
  for (const action of ['get', 'set', 'list', 'sync'] as const) {
    env
      .command(`${action} [key] [value]`)
      .option('--env <env>', 'production | preview | development', 'production')
      .option('--app <app>', 'apps/web | apps/wall', 'apps/web')
      .option('--example <path>', 'sync: path to .env.production.example')
      .option('--dry-run', 'log without executing', false)
      .action(async (
        key: string | undefined,
        value: string | undefined,
        opts: { env: string; app: string; example?: string; dryRun: boolean },
      ) => {
        const code = await envCommand({
          action: action as EnvAction,
          target: parseTarget(opts.env),
          key,
          value,
          app: opts.app,
          examplePath: opts.example,
          repoRoot,
          dryRun: opts.dryRun,
        });
        process.exitCode = code;
      });
  }

  program
    .command('logs')
    .description('Tail Vercel + Supabase logs.')
    .option('--service <service>', 'web | wall | supabase', 'web')
    .option('--deployment <url>', 'override the Vercel deployment URL')
    .option('--function <name>', 'specific Supabase function name')
    .option('--tail', 'follow the live stream', false)
    .option('--dry-run', 'log without executing', false)
    .action(async (opts: {
      service: string;
      deployment?: string;
      function?: string;
      tail: boolean;
      dryRun: boolean;
    }) => {
      const code = await logsCmd({
        service: parseService(opts.service),
        deploymentUrl: opts.deployment,
        functionName: opts.function,
        tail: opts.tail,
        dryRun: opts.dryRun,
      });
      process.exitCode = code;
    });

  program
    .command('release <platform>')
    .description('Mobile release: ios | android | both. Track is internal | production.')
    .option('--track <track>', 'internal | production', 'internal')
    .option('--skip-metadata', 'skip the fastlane metadata_push step', false)
    .option('--dry-run', 'log without executing', false)
    .action(async (
      platform: string,
      opts: { track: string; skipMetadata: boolean; dryRun: boolean },
    ) => {
      const code = await release({
        platform: parsePlatform(platform),
        track: parseTrack(opts.track),
        skipMetadata: opts.skipMetadata,
        dryRun: opts.dryRun,
        repoRoot,
      });
      process.exitCode = code;
    });

  return program;
}

/** Validate / coerce a theme string. Throws on unknown values. */
function parseTheme(value: string | undefined): SeedTheme | undefined {
  if (value === undefined) return undefined;
  if (value === 'wedding' || value === 'birthday' || value === 'corporate') return value;
  throw new Error(`Unknown theme: ${value}`);
}

/** Validate / coerce a target string. */
function parseTarget(value: string): EnvTarget {
  if (value === 'production' || value === 'preview' || value === 'development') return value;
  throw new Error(`Unknown env target: ${value}`);
}

/** Validate / coerce a service string. */
function parseService(value: string): LogsService {
  if (value === 'web' || value === 'wall' || value === 'supabase') return value;
  throw new Error(`Unknown service: ${value}`);
}

/** Validate / coerce a platform string. */
function parsePlatform(value: string): ReleasePlatform {
  if (value === 'ios' || value === 'android' || value === 'both') return value;
  throw new Error(`Unknown platform: ${value}`);
}

/** Validate / coerce a track string. */
function parseTrack(value: string): ReleaseTrack {
  if (value === 'internal' || value === 'production') return value;
  throw new Error(`Unknown track: ${value}`);
}
