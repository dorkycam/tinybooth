# TinyBooth

TinyBooth is a free, open-source (MIT) photobooth app for iOS and Android, phone and tablet. It runs fully on-device: no accounts, no backend, no network. It is a modern rebuild of the original 2018 PhotoBerry iOS app.

Read `CONTEXT.md` for the glossary (the shared language), `docs/prd.md` for the v1 spec, and `docs/plan.md` for the phased rebuild plan. Architecture decisions live in `docs/adr/`.

## Tech Stack

- **Single Expo app.** No monorepo, no workspaces. Use `pnpm`, never npm or yarn.
- **Framework**: Expo + Expo Router (file-based routing under `app/`), React Native, TypeScript strict.
- **Capture**: `react-native-vision-camera` for the live front-camera preview and photo capture.
- **Composition**: `@shopify/react-native-skia` composes the captured shots into the final strip image. See `docs/adr/0001-vision-camera-and-skia.md`.
- **Delivery**: OS print dialog (AirPrint / Android print) via `expo-print`, save to the photo library, and the native share sheet.
- **Audio**: `expo-audio` for countdown ticks and the shutter snap.
- **Local persistence**: `expo-secure-store` (wrapped in `src/lib/secureStore.ts`) for settings that should survive a re-install.
- **No network of any kind.** No accounts, no auth, no Supabase, no Prisma, no tRPC. No IAP, no paywall, no premium tier. No web or wall app. No AWS, no Apollo, no Redux. Don't add any of these without raising it first.

## Project Structure

```
app/                       # Expo Router routes (file-based)
  _layout.tsx              # Root layout; registers the Skia compose bridge on globalThis
  index.tsx                # Start screen
  choose-layout.tsx        # Layout picker before a session
  capture.tsx              # The live booth: countdown, capture loop, compose
  preview.tsx              # Strip preview + delivery (print / save / share / redo / done)
  settings.tsx             # Countdown length, idle timeout, sound / haptics / flash toggles
src/
  components/              # Shared presentational components (CameraSurface, CountdownOverlay, ...)
  hooks/                   # Hooks (useSettings, ...)
  lib/                     # cameraRoll, haptics, layouts, permissions, print, secureStore,
                           #   sessionSettings, share, skiaBridge, sounds
  theme/                   # useTheme + theme bridge; tokens/ holds color/typography/spacing
assets/                    # icons, images, sounds (countdown.mp3, shutter.mp3)
ios/                       # Prebuilt native iOS project (regenerate with `expo prebuild --clean`)
docs/                      # prd.md, plan.md, adr/
__tests__/                 # Vitest unit tests
scripts/                   # One-off tooling
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

Folders ARE appropriate when 3+ related files belong together. Never create a folder just to wrap a single file with an `index.ts`.

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
// app/preview.tsx — thin screen
import { StripPreview } from '@/components/StripPreview';
import { DeliveryPanel } from '@/components/DeliveryPanel';
export default function PreviewScreen() { ... }
```

Exceptions (small helpers can stay co-located):
- Layout-specific helpers in `_layout.tsx`
- Small icon/button wrappers under ~20 lines

**Targets:**
- Screens (page files): <= 300 lines
- Components: <= 200 lines
- Extract any inline component over 30 lines

Screens are thin consumers: they handle state and compose extracted components. No large JSX blocks inside a screen file.

## DRY (Don't Repeat Yourself)

**Never duplicate code.** If you find yourself copying logic, stop and refactor into a shared component or utility.

Common violations to avoid:
1. **Duplicate sheet/modal content** — extract one shared component.
2. **Repeated styled blocks** — if the same `StyleSheet` block appears in multiple files, lift to a shared component.
3. **Copy-pasted list items** — a generic list item with props beats N near-duplicates.
4. **Repeated loading / empty / error states** — shared `LoadingSkeleton`, `EmptyState`, `ErrorBoundary` components.

Before writing new code, ask:
- Does a similar component already exist in `src/components/`?
- Can I extend an existing component with new props?
- Is this pattern used in 2+ places? If yes, make it reusable.

## No Workarounds or Hacks

Don't:
- Implement fallbacks that mask a real bug.
- Hardcode values that should come from a shared module.
- Disable a TS error or test to make a build pass.

What to do instead: name the bug, fix the source, then re-test. If you cannot fix the source in this task, surface it to Camrynn and stop.

## Library-Style Component Design

Components should be self-contained modules that accept data and callbacks as props.

**Key principles:**
1. **Data as props.** Components receive their data through props, not by fetching internally.
2. **Callbacks for actions.** Pass `onPress`, `onSubmit`, etc. Never hardcode `router.push(...)` inside a presentational component.
3. **No hardcoded routes** in shared components. The screen handles navigation.

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
- Files: `PascalCase.tsx` for components (`CameraSurface.tsx`), `camelCase.ts` for utilities (`formatDate.ts`)

### Import Organization
```typescript
// 1. React / framework
import { useState, useEffect } from 'react';
import { View } from 'react-native';

// 2. External libraries
import { useKeepAwake } from 'expo-keep-awake';

// 3. Internal absolute (@/ aliases)
import { useTheme } from '@/theme/useTheme';

// 4. Relative
import { formatStripUrl } from './utils';

// 5. Types (with type keyword)
import type { StripLayout } from '@/lib/layouts';
```

## Styling Rules

### Mobile: useTheme() + StyleSheet
- Always pull colors from `useTheme()` (`src/theme/useTheme.ts`). The booth screens use the dark theme.
- The theme exposes `bg`, `surface`, `fg`, `subtle`, `hairline`, `primary` (mint), `primaryDeep`, `accent` (lavender), `accentDeep`, `highlight` (coral), plus `onPrimary`, `scrim`, `scrimStrong`, `cropMask`, `cropBorder`, and `flash` for the camera overlays.
- Use `StyleSheet.create()` at the bottom of the file. Inline `style={[..., { color: theme.colors.fg }]}` is fine for theme overrides.
- **Never hardcode hex or rgba color literals in component code.** If a token doesn't exist, add it to `src/theme/tokens/colors.ts` and propagate through `src/theme/theme.ts` first.
- Exception: the composed strip's print canvas color (`STRIP_BACKGROUND` in `src/lib/skiaBridge.ts`) is a fixed output-image constant, not a UI theme value.

## State Management

- **UI / session state**: `useState` / `useReducer`. Don't introduce Redux or Zustand without raising it first.
- **Persistent settings**: `expo-secure-store` via `src/lib/secureStore.ts` (with an in-memory fallback for tests), surfaced through `useSettings`. Don't use `AsyncStorage` for anything that should survive a re-install.

## Lazy-import rule (Metro)

This is the lesson from the launch debugging. **Never use `import(variableName)` in mobile code.** Metro requires static string literals for `import()` calls and will fail the bundle with `SyntaxError: Invalid call`.

Wrong:
```typescript
const moduleName = 'expo-secure-store';
const mod = await import(moduleName);
```

Right:
```typescript
const mod = await import('expo-secure-store');
```

When you need to lazy-load a native module that may be missing in tests, use a static `import('module-name')` inside a try/catch. Metro will still bundle it; tests swallow the runtime failure and fall back. This is how `secureStore.ts`, `sounds.ts`, `CameraSurface.tsx`, and `skiaBridge.ts` stay testable.

## Capture and composition

- `app/capture.tsx` owns the capture state machine: idle -> countdown -> reveal (peek) -> repeat for each shot -> composing. It keeps the screen awake while in use.
- Per-shot feedback comes from Settings: countdown ticks (sound + haptics), then on capture a shutter sound, a capture haptic, and a brief white screen-flash. All three are toggleable.
- `CameraSurface` lazy-loads vision-camera and exposes `takePhoto()` via an imperative ref. When the native module is absent (tests, web), it renders a themed dark placeholder.
- `src/lib/skiaBridge.ts` registers a compose function on `globalThis.__TINYBOOTH_SKIA_RENDER__` from the root layout so the capture flow can call it without a static Skia import. Layout geometry comes from `src/lib/layouts.ts`.

## Hard rules (enforced by the campsite check on every PR)

- No em dashes anywhere: code, comments, docs, copy. Use periods, commas, semicolons.
- No AI-sounding words: leverage, robust, comprehensive, seamless, streamline, elevate, optimize, synergy, empower, holistic, pivotal, delve, tapestry, landscape (as metaphor), testament, groundbreaking, revolutionary, game-changing, cutting-edge, state-of-the-art, innovative (as assertion), transformative, dynamic, mission-critical, vibrant, showcasing, profound, diverse array.
- No phrases like "that said", "I want to be transparent", "to be honest", "it's important to note". Just state facts.
- All copy reads like a real person wrote it.
- Be specific with numbers and real details, never vague claims.

## Commands

```bash
# Install
pnpm install

# Dev
pnpm exec expo start --lan

# Quality bar (run before any commit)
npx tsc --noEmit
pnpm test

# Regenerate the native iOS project (after changing app.json / native deps)
pnpm exec expo prebuild --platform ios --clean
```

## Pre-commit checklist

1. `npx tsc --noEmit` and `pnpm test` exit 0.
2. New exported functions have explicit return types and JSDoc.
3. No em dashes, no banned AI words.
4. No hardcoded hex / rgba color literals in component code.
5. No `any` types.
6. No `import(variableName)` calls.
7. Conventional commit prefix (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
8. Local commits only unless Camrynn explicitly says push.

## Important reads when picking up work

- `CONTEXT.md` — the glossary and the agreed scope (what is and is not in v1).
- `docs/prd.md` — the v1 product spec.
- `docs/plan.md` — the phased rebuild plan.
- `docs/adr/0001-vision-camera-and-skia.md` — why vision-camera + Skia.
