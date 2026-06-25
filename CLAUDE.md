# TinyBooth

Monorepo for TinyBooth (the photobooth app) and TinyWall (the photo wall) under one event concept. See `docs/plan.md` for the master plan, `WAKE_UP.md` for the launch state.

## Tech Stack

- **Monorepo**: Turborepo + pnpm workspaces. Use `pnpm`, never npm or yarn.
- **Mobile** (`apps/mobile`): Expo + Expo Router (file-based routing), React Native, TypeScript strict, vision-camera + Skia for capture/composition, expo-print for AirPrint, RevenueCat for IAP.
- **Web** (`apps/web`): Next.js 14 App Router. Marketing site + dashboard + APIs (tRPC + a thin REST shim).
- **Wall** (`apps/wall`): Next.js 14 App Router. TV display + guest upload page.
- **Database**: Supabase Postgres + Prisma (schema lives in `apps/web/prisma`).
- **Auth**: Supabase Auth (Apple + Google + email magic link). No passwords.
- **Realtime**: Supabase Realtime (Postgres CDC). Falls back to short-interval polling in dev when envs are absent.
- **Storage**: Cloudflare R2 (zero egress fee). Storage layer abstracted in `apps/web/src/lib/storage.ts` with a local-disk dev fallback.
- **Email**: Resend. Local-disk fallback writes to `apps/web/.emails/`.
- **SMS**: Twilio. Local-disk fallback writes to `apps/web/.sms/`.
- **Payments**: RevenueCat for IAP (Strip Unlock, Event Pass, Event Pass Plus). Stripe for web purchases.
- **CLI**: `pnpm tinybooth` for setup/deploy/migrate/seed/env/logs/release. See `packages/cli/README.md`.
- **No AWS**, no Apollo, no Redux. Don't add them without raising it first.

## Project Structure

```
apps/
  mobile/                  # Expo (React Native), file-based routes via expo-router
    app/                   # Routes: (camera), (tabs), index, etc.
    src/
      components/          # Shared mobile components
      hooks/               # Mobile hooks
      lib/                 # iap, print, secureStore, share, etc.
      theme/               # useTheme + theme bridge over @tinybooth/ui-tokens
  web/                     # Next.js: tinybooth.com marketing + dashboard + APIs
    app/                   # App Router pages
    src/
      components/          # Shared web components (brand, dashboard, marketing)
      lib/                 # storage, email, sms, stripe, analytics, etc.
      server/              # tRPC routers + jobs (applyPurchase, exportEvent, cleanup)
    prisma/                # schema.prisma + migrations
  wall/                    # Next.js: TV display + guest upload page
packages/
  ui-tokens/               # Brand color/typography/spacing tokens
  api-types/               # Shared TS interfaces (Event, Post, Photo, Strip, ...)
  api-client/              # tRPC client + React Query helpers (used by mobile + web + wall)
  messages/                # Static random-message library, migrated verbatim from the Swift app
  strip-render/            # Layout math (universal-safe). Subpath imports for sharp/skia/igShare.
  billing/                 # Product catalog + entitlement evaluator. Single source of truth for prices.
  auth/                    # Supabase Auth wrapper (server-side getSession + client factories)
  cli/                     # The pnpm tinybooth CLI
  config/                  # Shared eslint, tsconfig, prettier base configs
data/
  backups/                 # Local-only TinyWall data dumps (gitignored)
docs/                      # plan.md, research/, brand/, decisions/ (ADRs), launch-checklist, etc.
scripts/                   # One-off tooling (migrate-tinywall, etc.)
```

## File Structure Guidelines

**Keep file structure FLAT. No unnecessary folder wrappers.**

Don't:
```
src/components/ui/
  Button/
    Button.tsx
    index.ts        # just re-exports
```

Do:
```
src/components/ui/
  Button.tsx
  Card.tsx
  Icon.tsx
  index.ts          # one barrel re-exports them all
```

Folders ARE appropriate when:
- 3+ related files belong together (`apps/web/src/server/api/routers/`, `apps/web/src/server/jobs/`)
- A feature truly justifies its own bundle of files

Never create a folder just to wrap a single file with an `index.ts`.

## Component Organization

**One component per file.** Don't define multiple large components in a single file.

Don't:
```typescript
// preview.tsx — TOO MANY COMPONENTS
export default function PreviewScreen() { ... }
function StripPreview() { ... }      // 60+ lines
function DeliveryPanel() { ... }     // 80+ lines
```

Do:
```typescript
// app/(camera)/preview.tsx — thin screen
import { StripPreview } from '@/components/StripPreview';
import { DeliveryPanel } from '@/components/DeliveryPanel';
export default function PreviewScreen() { ... }
```

Exceptions (small helpers can stay co-located):
- Layout-specific helpers in `_layout.tsx`
- Small icon/button wrappers under ~20 lines

**Targets:**
- Screens (page files): ≤ 300 lines
- Components: ≤ 200 lines
- Extract any inline component over 30 lines

Screens are thin consumers: they handle queries, state, and compose extracted components. No large JSX blocks inside a screen file.

## DRY (Don't Repeat Yourself)

**Never duplicate code.** If you find yourself copying logic, stop and refactor into a shared component or utility.

Common violations to avoid:
1. **Duplicate sheet/modal content** — extract one shared component (e.g. `StripUnlockModal`).
2. **Repeated styled blocks** — if the same Tailwind classes or `StyleSheet` block appears in multiple files, lift to a shared component.
3. **Copy-pasted list items** — generic list item with props beats N near-duplicates.
4. **Repeated loading / empty / error states** — shared `LoadingSkeleton`, `EmptyState`, `ErrorBoundary` components.

Before writing new code, ask:
- Does a similar component already exist in `src/components/` or `apps/*/src/components/`?
- Can I extend an existing component with new props?
- Is this pattern used in 2+ places? If yes, make it reusable.

## No Workarounds or Hacks

If the backend (tRPC routers, Prisma queries, Supabase Realtime) is returning wrong data, the fix belongs there, not in the frontend.

Don't:
- Add frontend logic that "fixes" incorrect server data.
- Implement fallbacks that mask backend bugs.
- Hardcode values the API should return.
- Disable a TS error or test to make a build pass.

What to do instead: name the bug, fix the source, then re-test. If you cannot fix the source in this task, surface it to Camrynn and stop.

## Library-Style Component Design

Components should be self-contained modules that accept data and callbacks as props.

**Key principles:**
1. **Data as props.** Components receive their data through props, not by fetching internally.
2. **Callbacks for actions.** Pass `onPress`, `onSubmit`, etc. — never hardcode `router.push(...)` or tRPC calls inside a presentational component.
3. **No hardcoded routes** in shared components. The screen handles navigation.
4. **No client-side feature gating.** The server (via `@tinybooth/billing` `evaluateEvent`) decides what to expose. Don't hardcode tier checks in the UI to hide features — render what the server returns and show an empty state if needed.

Good (library style):
```typescript
export interface PhotoStripPreviewProps {
  strip: StripData;
  onPrint: () => void;
  onShare: () => void;
  onSave: () => void;
}

export function PhotoStripPreview({ strip, onPrint, onShare, onSave }: PhotoStripPreviewProps): JSX.Element {
  // UI only. No data fetching. No router.push calls.
}
```

Usage at the screen:
```typescript
<PhotoStripPreview
  strip={strip}
  onPrint={() => printStrip(strip.uri)}
  onShare={() => router.push('/share')}
  onSave={() => saveToCameraRoll(strip.uri)}
/>
```

## Code Style

### TypeScript
- **Strict mode**. No implicit any. No `any` — use `unknown` and narrow.
- **Never** suppress errors with `@ts-ignore` / `@ts-expect-error` unless there's a genuine library bug with no workaround.
- **Explicit return types** on every exported function.
- **JSDoc** on every exported function and non-trivial helper.
- Semicolons at end of statements.
- Prefer `async`/`await` over `.then()` chains.
- Use `import type { ... }` for type-only imports.

### Naming
- `camelCase` for variables and functions
- `PascalCase` for types, interfaces, classes, components
- `SCREAMING_SNAKE_CASE` for constants and enum values
- Files: `PascalCase.tsx` for components (`PhotoStripPreview.tsx`), `camelCase.ts` for utilities (`formatDate.ts`)

### Import Organization
```typescript
// 1. React / framework
import { useState, useEffect } from 'react';
import { View } from 'react-native';

// 2. External libraries
import { useQuery } from '@tanstack/react-query';

// 3. Internal absolute (workspace packages or @/ aliases)
import { COLORS } from '@tinybooth/ui-tokens';
import { useTheme } from '@/theme/useTheme';

// 4. Relative
import { formatStripUrl } from './utils';

// 5. Types (with type keyword)
import type { Strip } from '@tinybooth/api-types';
```

## Styling Rules

TinyBooth has two styling worlds. Don't mix them.

### Web + Wall: Tailwind only
- Tailwind classes are configured to read from `@tinybooth/ui-tokens` via the Tailwind theme extension in `apps/{web,wall}/tailwind.config.ts`.
- **Never hardcode hex codes** in className or in inline `style` props. Use the token classes (`bg-mint`, `text-cream`, `border-slate2`, `text-lavender`, `bg-coral`, etc.).
- The brand defaults to dark mode. Backgrounds are `bg-carbon`, body text is `text-cream`. Mint is the primary accent, Lavender is the CTA accent, Coral is the tertiary highlight.
- Inline `style={{ background: brandingColor }}` is acceptable ONLY when the value is event-supplied at runtime (e.g. an event's brand color override on the wall upload screen). Static colors must be Tailwind tokens.

### Mobile: useTheme() + StyleSheet
- Always pull colors from `useTheme()` (`apps/mobile/src/theme/useTheme.ts`). Defaults to dark mode.
- Theme exposes `primary` (mint), `accent` (lavender), `highlight` (coral), `bg`, `surface`, `fg`, `subtle`, `hairline`, `primaryDeep`, `accentDeep`.
- Use `StyleSheet.create()` at the bottom of the file. Inline `style={[..., { color: theme.colors.fg }]}` is fine for theme overrides.
- **Never hardcode hex codes** in mobile component code. If a token doesn't exist, add it to `@tinybooth/ui-tokens` and propagate through `apps/mobile/src/theme/theme.ts` first.

### Per-event branding
The wall upload + TV display + the booth strip border read event-specific colors from `event.branding` JSON. Components accept an optional `branding` prop and only override the brand defaults when set. The brand defaults must always render correctly when no branding is set.

## State Management

- **Server state**: `@tanstack/react-query` via the tRPC client in `@tinybooth/api-client`. Used by mobile + web + wall.
- **UI state**: `useState` / `useReducer`. Don't introduce Redux or Zustand without raising it first.
- **Auth session (mobile)**: persisted via `expo-secure-store` (with an in-memory fallback for tests). Wrapped in `useSession()`.
- **Auth session (web)**: Supabase Auth + `@supabase/ssr` cookies.
- **Persistent client config (mobile)**: `expo-secure-store`. Don't use `AsyncStorage` for anything that should survive a re-install.

## Lazy-import rule (Metro)

This is the lesson from the launch debugging. **Never use `import(variableName)` in mobile code.** Metro requires static string literals for `import()` calls and will fail the bundle with `SyntaxError: Invalid call`.

Wrong:
```typescript
const moduleName = 'expo-secure-store';
const mod = await import(/* @vite-ignore */ moduleName);
```

Right:
```typescript
const mod = await import('expo-secure-store');
```

The web side (Next.js / Webpack) tolerates the variable form via magic comments. Mobile does not. If you need to lazy-load a module that may be missing in tests, use a static `import('module-name')` inside a try/catch — Metro will still bundle it, but tests can swallow the runtime failure.

## Schema, migrations, and seeded data

- Prisma schema lives at `apps/web/prisma/schema.prisma`. It's the single source of truth for the data model.
- Schema changes go through migrations (`pnpm --filter @tinybooth/web exec prisma migrate dev --name describe_change`). Never hand-edit the database.
- The `cleanup` cron (`apps/web/src/lib/cleanup.ts`) drops events past `retainUntil`. Free tier = 7 days, Event Pass = 60, Event Pass Plus = 90.
- Seed scripts live in `scripts/`. The TinyWall migration script (`scripts/migrate-tinywall.ts`) defaults to `--dry-run` and requires multiple confirmations to actually write.

## Auth flows

Four flows, in order of frequency:
1. **TinyBooth standalone** — no account, no network. Photos stay on device.
2. **TinyWall guest upload** — no account ever. Per-IP rate limit. Anon device token in localStorage for "delete my own post" later.
3. **Event host (mobile)** — Supabase Auth via Apple Sign-In (default), Google, magic link. JWT in `expo-secure-store`. RLS enforces ownership.
4. **Event host (web dashboard)** — same Supabase Auth, cookies via `@supabase/ssr`.

Apple Sign-In is required by Apple's 4.8 rule when any other social auth is offered. Don't remove it.

## Hard rules (enforced by the campsite check on every PR)

- No em dashes anywhere — code, comments, docs, copy. Use periods, commas, semicolons.
- No AI-sounding words: leverage, robust, comprehensive, seamless, streamline, elevate, optimize, synergy, empower, holistic, pivotal, delve, tapestry, landscape (as metaphor), testament, groundbreaking, revolutionary, game-changing, cutting-edge, state-of-the-art, innovative (as assertion), transformative, dynamic, mission-critical, vibrant, showcasing, profound, diverse array.
- No phrases like "that said", "I want to be transparent", "to be honest", "it's important to note". Just state facts.
- All copy reads like a real person wrote it.
- Be specific with numbers and real details, never vague claims.

## Commands

```bash
# Install
pnpm install

# Dev (run in two terminals, plus optionally a third for mobile)
pnpm --filter @tinybooth/web dev          # http://localhost:3000
pnpm --filter @tinybooth/wall dev         # http://localhost:3001
cd apps/mobile && pnpm exec expo start --lan

# Quality bar (run before any commit)
pnpm turbo run lint typecheck test build

# CLI
pnpm tinybooth doctor                     # checks every required CLI is installed
pnpm tinybooth setup                      # one-time provider bootstrap
pnpm tinybooth deploy                     # vercel web + wall to prod
pnpm tinybooth deploy --staging
pnpm tinybooth migrate                    # prisma migrate deploy
pnpm tinybooth seed event "Cam's Demo" --theme=wedding
pnpm tinybooth release ios --track=internal
```

## Pre-commit checklist

1. `pnpm turbo run lint typecheck test build` exits 0.
2. New exported functions have explicit return types and JSDoc.
3. No em dashes, no banned AI words.
4. No hardcoded hex codes.
5. No `any` types.
6. No `import(variableName)` calls in mobile code.
7. Conventional commit prefix (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
8. Local commits only unless Camrynn explicitly says push.

## Important reads when picking up work

- `docs/plan.md` — every major decision and the alternative we passed on.
- `docs/launch-checklist.md` — sequenced steps to ship.
- `docs/iap-setup.md` — App Store Connect + Play Console + RevenueCat + Stripe walkthrough.
- `docs/brand/identity.md` — brand system (mint primary, lavender accent, coral highlight, dark default).
- `docs/research/` — competitor, user, tech-stack, monetization, SEO research that informs decisions.
- `docs/decisions/` — ADRs: monorepo choice, Supabase over Neon, single CLI for ops.
- `docs/followups.md` — deferred items, prioritized.
- `WAKE_UP.md` — current launch state and what needs Camrynn next.
