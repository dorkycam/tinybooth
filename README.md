# tinybooth

Monorepo for the TinyBooth product family.

## Structure

```
apps/
  mobile/   Expo (React Native) photobooth app
  web/      tinybooth.com marketing site + dashboard + APIs
  wall/     TinyWall TV display + guest upload page
packages/
  api-types/  Shared TS interfaces
  config/     Shared eslint, tsconfig, prettier base configs
  messages/   Random message library (migrated from Swift app)
  ui-tokens/  Brand tokens (color, type, spacing)
infra/
  terraform/  Staging and production infra
data/
  backups/    Local-only TinyWall data dumps (gitignored)
docs/         Plan, research, brand identity, ADRs
scripts/      One-off tooling (migrations, etc.)
```

## Prerequisites

- Node 20 (use `nvm use`)
- pnpm 9 (`corepack enable pnpm`)

## Run

```sh
pnpm install
pnpm dev
```

Workspace tasks:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Notes

- `tinybooth-old/` (the original Swift app) and `tinybooth-wall/` (the existing Vercel TinyWall) live as siblings to this repo and are excluded from version control. They are kept as read-only reference until their content is folded in.
- Backups under `data/backups/` are private and gitignored. The empty directory is tracked via `.gitkeep`.
