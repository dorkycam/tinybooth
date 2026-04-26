# 0003. Single CLI wrapper for infra ops

- Status: accepted
- Date: 2026-04-26
- Deciders: Camrynn

## Context

TinyBooth's runtime stack is Vercel + Supabase + Cloudflare R2 + Resend +
Stripe + RevenueCat + Twilio + EAS + Fastlane. That is nine provider CLIs
each with its own auth flow, its own argument shape, and its own version
cadence. A typical "ship it" flow taps four of them in sequence:
`vercel deploy --prod`, then `supabase db push`, then `stripe products
create`, then `eas build --platform all --profile production`. None of
that fits in muscle memory and none of it is forgiving when run in the
wrong order.

Options considered:

- **Status quo.** Camrynn types each CLI by hand, plus the existing
  `apps/mobile/scripts/build-and-submit.sh` for mobile. The cost is mental
  load and a permanent risk of skipping a step (forgetting to run the
  quality gate before deploy, forgetting to push env vars to Vercel after
  changing them locally).
- **A wrapper CLI (`@tinybooth/cli`)** that shells out to the underlying
  provider CLIs from a single `tinybooth <command>` surface, with `--dry-run`
  on every command. One install, one auth-state lookup via `tinybooth
  doctor`, and a single interactive `tinybooth setup` flow that walks
  through every account hookup and stores results in
  `~/.config/tinybooth/config.json`.
- **Embed the SDKs directly** (`@vercel/sdk`, `@supabase/supabase-js`,
  `stripe`). Most flexible but slower (lazy-loading the SDKs adds startup
  time), heavier (every install pulls them all), and lags behind the
  provider CLI on new features.

## Decision

Build `@tinybooth/cli`. Shell out to provider CLIs via `execa` (same shape
the user would type by hand). Lazy-import the few SDKs we still need
(`stripe`, `resend`) so cold-path commands stay cheap to install.

Eight commands cover every flow we run more than once a quarter:
`doctor`, `setup`, `deploy`, `migrate`, `seed`, `env`, `logs`, `release`.

## Consequences

- One install (`pnpm install`), one entry point (`pnpm tinybooth`), one
  command surface to remember.
- Every command is dry-runnable. CI can call `tinybooth doctor --dry-run`
  and `tinybooth migrate --check` as guards.
- The CLI does not own provider auth state. It calls each provider's
  `whoami` / `auth status` and routes to the provider's own login flow.
  That keeps secrets out of our config file (only paths and project ids
  live there).
- Provider CLI version drift is now a single failure mode (`tinybooth
  doctor` reports it) instead of a surprise mid-deploy.
- The legacy `apps/mobile/scripts/build-and-submit.sh` stays around because
  CI still references it; the CLI's `release` command shells into it
  rather than duplicating its logic.
- Documentation (launch-checklist.md, WAKE_UP.md) now points at
  `pnpm tinybooth setup` instead of nine separate CLI install + login
  + configure steps.
- The CLI is reversible. Every command is a thin wrapper, so dropping it
  later means typing the underlying provider commands by hand again.
