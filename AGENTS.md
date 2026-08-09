# AGENTS.md

Instructions for any coding agent or human contributor working in this repo. This is the
canonical rulebook. `CLAUDE.md` and other tool files just point here.

TinyBooth is a free, open-source (MIT) photobooth app for iOS and Android, phone and tablet.
It runs fully on-device: no accounts, no backend, no network. It is a modern rebuild of the
original 2018 PhotoBerry iOS app.

## How to run it

This app uses native modules (`react-native-vision-camera`, `@shopify/react-native-skia`),
so it does **not** run in Expo Go. You need a dev build:

```bash
pnpm install
pnpm ios       # or: pnpm android   (requires Xcode / Android Studio once)
```

`pnpm typecheck` and `pnpm test` run without native tooling.

## Tech stack

- Single Expo app (Expo Router, file-based routes under `app/`). No monorepo, no workspaces.
- `react-native-vision-camera` for capture, `@shopify/react-native-skia` for composing the
  strip at print DPI. See the architecture note in the project docs.
- `expo-print` (print), `expo-media-library` (save), the OS share sheet (share),
  `expo-audio` (sounds), `expo-haptics`, `expo-keep-awake`, `expo-brightness` (screen flash).
- Persistence: `@react-native-async-storage/async-storage` holds the booth/session settings
  (`src/lib/sessionSettings.ts`); `expo-secure-store` holds only the theme preference
  (`src/theme/ThemeContext.tsx`).
- No network of any kind. No auth, no payments, no events, no web/wall. Don't add any of
  these without opening an issue first.

## Code conventions (hard rules)

- **TypeScript strict.** No `any` (use `unknown` and narrow). No `@ts-ignore` /
  `@ts-expect-error` unless there's a genuine library bug with no workaround.
- **Explicit return types and JSDoc** on every exported function and non-trivial helper.
- **Theme tokens only.** Never hardcode hex codes in component code; pull colors from
  `useTheme()`. Tokens live in `src/theme/tokens/`.
- **One component per file.** Screens <= 300 lines, components <= 200, extract any inline
  component over ~30 lines.
- **Library-style components:** data and callbacks come in as props. No data fetching and no
  hardcoded navigation (`router.push`) inside presentational components.
- **Metro rule:** never `import(variableName)` in app code. Metro needs a static string
  literal: `await import('expo-haptics')`.
- **Keep the file tree flat.** No folder that just wraps a single file with an `index.ts`.
- **DRY.** If logic repeats in 2+ places, extract a shared component or util.
- **No workarounds.** If something's wrong at the source, fix the source. Don't mask it with
  a fallback or disable a test/type error to go green.

For the deeper rulebook (architecture, file organization, component/hook patterns, TypeScript
conventions, testing, and tooling), see **[CODING_STANDARDS.md](./CODING_STANDARDS.md)**. The
hard rules above are canonical; CODING_STANDARDS.md expands on them and never contradicts them.

## Writing style (enforced)

Applies to code, comments, docs, and UI copy.

- No em dashes. Use periods, commas, semicolons.
- No AI-sounding filler: leverage, robust, comprehensive, seamless, streamline, elevate,
  optimize, synergy, holistic, delve, tapestry, testament, groundbreaking, revolutionary,
  game-changing, cutting-edge, state-of-the-art, transformative, etc.
- No "that said", "it's important to note", "to be honest". Just state the fact.
- Be specific with real numbers and details.

## Commits and PRs

- **Conventional Commits:** `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`. Include
  a scope when useful (`feat(capture): ...`). Releases are automated from these messages.
- Keep commits focused. Run `pnpm typecheck` and `pnpm test` before committing.
- Open a PR against `main`. Fill in the PR template. CI (lint, typecheck, test, secret scan)
  must pass. A maintainer reviews and merges.

## Security (read before committing)

- **Never commit secrets.** No API keys, `.p8` / `.p12` / keystores, service-account JSON,
  `.env` files, or signing material. These belong in EAS's credential store, not git.
- Signing credentials for builds live in EAS, not in this repo.
- A `gitleaks` pre-commit hook and a CI secret-scan are set up to catch mistakes; do not
  disable them. If a hook flags something, stop and fix it, don't bypass with `--no-verify`.
- Report a vulnerability privately per `SECURITY.md`, not in a public issue.

## Scope

Feature requests and roadmap items (filters, color presets, captions, more layouts, camera
flip) go through GitHub Issues. Keep v1 small and offline.
