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

## Branches

- **`develop`** is the default branch and the one you target. Branch off it, PR back into it.
- **`main`** is release-only. It receives merges from `develop`, and nothing else.

Both branches are protected: no direct pushes, PR required, CI must pass, and every PR needs
an approving review from [@dorkycam](https://github.com/dorkycam) (see
[.github/CODEOWNERS](./.github/CODEOWNERS)), who is auto-requested when you open it.

### Branch naming

```
<type>/<issue-number>-<short-descriptor>
```

Same types as Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. The
issue number is the ticket the branch closes. The descriptor is a few lowercase words joined
by hyphens.

```bash
git checkout develop && git pull
git checkout -b feat/123-layout-picker
```

| Branch | Verdict |
|---|---|
| `feat/123-layout-picker` | Good |
| `fix/88-countdown-drift` | Good |
| `chore/210-bump-expo-audio` | Good |
| `docs/readme-links` | Allowed only when there is genuinely no issue |
| `layout-picker` | Rejected, no type |
| `feature/123-layout-picker` | Rejected, use `feat` |
| `feat/123_Layout_Picker` | Rejected, lowercase and hyphens only |

A `pre-push` hook checks this locally. If you have no issue number, the `<type>/<descriptor>`
form is accepted, same as the "No issue" escape in the PR template — but prefer filing the
issue first.

## Before you open a PR

1. Read **[AGENTS.md](./AGENTS.md)** — it's the full rulebook (code style, conventions,
   commit format, security).
2. `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
3. Commits follow **Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
   `test:`). Releases are generated from these.
4. No secrets in the diff. No hardcoded hex. No `any`. No em dashes or AI-filler words.
5. Fill in the PR template.
6. Open the PR against **`develop`**.

## Scope and roadmap

Keep v1 small and offline. Bigger ideas (photo filters, strip color presets, captions, more
layouts, front/back camera toggle) are tracked as GitHub Issues. Open an issue to discuss
before building something large.

## How releases work

Contributors don't need to do anything release-related. For maintainers, the chain is:

1. PRs merge into `develop`. CI runs typecheck, lint, test, and a secret scan.
2. When `develop` is ready, a maintainer opens a PR from `develop` into `main`.
3. On merge to `main`, **release-please** reads the Conventional Commits and opens (or
   updates) a "Release vX.Y.Z" PR that bumps `package.json` and `app.json`, and writes
   `CHANGELOG.md`.
4. Merging that release PR tags `vX.Y.Z` and publishes a **GitHub Release** with the
   generated notes.
5. The tag triggers `build.yml`, a gated EAS build + store submit. It waits on the `release`
   environment's required reviewer, so nothing ships without approval.

Version numbers come from the commit types: `fix:` bumps patch, `feat:` bumps minor, and a
`!` or `BREAKING CHANGE:` footer bumps major.
