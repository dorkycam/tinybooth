# Contributing to TinyBooth

Thanks for helping out. TinyBooth is a free, open-source, fully offline photobooth app. The
goal is to keep it small, private, and easy to run.

## Setup

```bash
pnpm install
pnpm ios        # or: pnpm android
```

This app uses native modules (vision-camera, Skia), so it needs a **dev build** and does not
run in Expo Go. You'll need Xcode (iOS) or Android Studio (Android) for the first build.
`pnpm typecheck` and `pnpm test` run without native tooling.

## Before you open a PR

1. Read **[AGENTS.md](./AGENTS.md)** — it's the full rulebook (code style, conventions,
   commit format, security).
2. `pnpm typecheck` and `pnpm test` pass.
3. Commits follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
   `test:`). Releases are generated from these.
4. No secrets in the diff. No hardcoded hex. No `any`. No em dashes or AI-filler words.
5. Fill in the PR template.

## Scope and roadmap

Keep v1 small and offline. Bigger ideas (photo filters, strip color presets, captions, more
layouts, front/back camera toggle) are tracked as GitHub Issues. Open an issue to discuss
before building something large.

## How releases work

`main` is always releasable. Maintainers cut releases via tags, which trigger a gated CI
build to TestFlight / Play. Contributors don't need to do anything release-related.
