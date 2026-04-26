# @tinybooth/cli

One CLI for every TinyBooth infra op. If you wanted to type
`vercel deploy --prod`, `supabase db push`, `wrangler r2 bucket create`,
`stripe products create`, `eas build`, and `bundle exec fastlane metadata_push`
in sequence, this is that, with one command.

## Install

The CLI lives inside the monorepo. From the repo root:

```bash
pnpm install
pnpm tinybooth --help
```

If you want it on PATH outside the repo, link it once:

```bash
pnpm --filter @tinybooth/cli link --global
tinybooth --help
```

## Commands

| Command | Use |
|---|---|
| `tinybooth doctor [--dry-run]` | Verify required CLIs + auth + local config. CI-safe. |
| `tinybooth setup [--dry-run]` | One-shot interactive bootstrap of every account. Idempotent. |
| `tinybooth deploy [--staging] [--skip-quality] [--dry-run]` | Quality gate then `vercel deploy` for `apps/web` and `apps/wall`. |
| `tinybooth migrate [--check] [--dry-run]` | `prisma migrate deploy`. `--check` exits non-zero if there are pending migrations. |
| `tinybooth seed event <name> [--theme=wedding\|birthday\|corporate]` | POST to `event.create` for demos / smoke tests. |
| `tinybooth env <get\|set\|list\|sync> [--env=production\|preview]` | Wraps `vercel env`. `sync` prompts for any missing keys against `.env.production.example`. |
| `tinybooth logs [--service=web\|wall\|supabase] [--tail]` | Tail Vercel + Supabase logs. |
| `tinybooth release <ios\|android\|both> [--track=internal\|production]` | Calls `apps/mobile/scripts/build-and-submit.sh` then `bundle exec fastlane metadata_push`. |

`setup` is the one you run more than `deploy`. It hand-walks you through the
full provider hookup once and writes results to
`~/.config/tinybooth/config.json` plus `.env.tinybooth` so re-runs pick up
where they left off.

## Dry-run

Every command honors `--dry-run`. Under that flag we log exactly what we
would run instead of running it. Use it before any real operation to confirm
the plan.

## Required CLIs

`tinybooth doctor` checks for these. Install them once:

```bash
pnpm add -g vercel eas-cli wrangler
brew install supabase/tap/supabase stripe/stripe-cli/stripe gh
gem install bundler && (cd apps/mobile && bundle install)
```

## What setup will not do (you do it in the dashboard)

The CLI cannot do the things the providers do not expose APIs for:

- App Store Connect: enroll in the Small Business Program, create the IAP
  products, fill the App Privacy questionnaire, submit for review.
- Google Play Console: create the Managed Products, fill the Data Safety
  form, set the Internal Testing track.
- Stripe: complete KYC + Tax registration; flip live mode after Apple +
  Google approvals.
- RevenueCat: create the project, attach the App Store Connect API key and
  Play Service Account JSON, define entitlements.
- Resend: verify the domain after CLI pushes the DNS records (verification
  is automatic but takes a few minutes).
