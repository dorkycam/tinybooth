# CLAUDE.md

The conventions for this repo live in **[AGENTS.md](./AGENTS.md)** — read it first. It is the
single source of truth for code style, the Metro `import()` rule, commit format, PR process,
writing-style rules, and the security rules (never commit secrets).

Claude-specific notes:

- Honor `AGENTS.md` exactly; user instructions still take precedence over it.
- This is a single Expo app (no monorepo). Run `pnpm typecheck` / `pnpm test` to verify
  changes; the full app needs a dev build (`pnpm ios` / `pnpm android`), not Expo Go.
- Internal planning docs (PRD, plan, glossary, ADRs) are kept locally under `.private/` and
  are intentionally not part of the published repo.
