# 0001. Monorepo with Turborepo and pnpm

- Status: accepted
- Date: 2026-04-26
- Deciders: Camrynn

## Context

We ship three TypeScript apps (Expo mobile, Next.js marketing/dashboard, Next.js TV display) plus several shared packages (api types, brand tokens, message library, render math). All three apps share types and tokens, and at least two need the same auth + tRPC client. A polyrepo would force us to publish private packages to npm or use git submodules to share code, which is friction for a solo dev.

We considered:

- Polyrepo with private npm packages. Costs version-bump churn and a publish step on every change to a token or type.
- Nx monorepo. Powerful but heavy; the project graph and generators are more than we need for three apps.
- Turborepo + pnpm workspaces. Vercel-native, fast remote cache, minimal config.

## Decision

Use Turborepo with pnpm workspaces. Apps live under `apps/*`, shared code under `packages/*`. Tasks (`build`, `lint`, `typecheck`, `test`, `dev`) run through Turbo so caching works the same locally and in CI.

## Consequences

- One install, one lockfile (`pnpm-lock.yaml`), one CI cache layer.
- Cross-package edits land in a single PR with a single CI run.
- Per-package `package.json` files can be small because shared configs live in `packages/config`.
- Vendor lock-in to Turborepo is low; the only Turbo-specific file is `turbo.json` and tasks fall back to per-package npm scripts.
- We get free remote caching on Vercel which keeps CI fast as the repo grows.
