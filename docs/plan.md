# TinyBooth rebuild plan

Goal: turn the current stripped repo into the single-app, offline, MIT photobooth described
in `docs/prd.md`. Reuse the proven local modules; delete all SaaS code; flatten the monorepo.

Quality bar per phase: `tsc --noEmit` clean, unit tests green, no `any`, no SaaS imports
left, no em dashes / banned words.

## Phase 0 - Flatten & strip to a single app

- Move `apps/mobile/*` to the repo root (`app/`, `src/`, `assets/`, `ios/`, configs).
- Inline `packages/ui-tokens` colors/typography/spacing into `src/theme/` and delete the
  package + `packages/`, `turbo.json`, `pnpm-workspace.yaml`, `.turbo/`.
- Rewrite root `package.json` as a single Expo app (scripts: start, ios, android, typecheck,
  test, lint). Drop turbo/workspace tooling. Keep pnpm or switch to npm (decide in build;
  pnpm is fine).
- Remove now-dead dependencies: `@supabase/supabase-js`, `react-native-purchases`,
  `expo-apple-authentication`, `expo-auth-session`, and the four `@tinybooth/*` workspace deps.
- Add `LICENSE` (MIT) at root.

## Phase 1 - Delete SaaS code from the app

- Delete: `src/lib/auth.ts`, `iap.ts`, `accountApi.ts`, `eventConnection.ts`,
  `stripDelivery.ts` (review first); `src/hooks/useEntitlement.ts`, `useSession.ts`
  (auth parts), `useEventConnection.ts`, `useRandomMessage.ts` (depends on messages);
  components `EventQRScanner.tsx`, `DeliveryPanel.tsx` (rebuild), `LayoutPicker.tsx`
  (rebuild for 2 layouts), `WhatsNewModal.tsx`, `BoothControlsSheet.tsx` (review).
- Delete routes: `app/(camera)/paywall.tsx`, `strip-unlock.tsx`, `setup.tsx` (review),
  `app/(tabs)/event.tsx`, `privacy.tsx`/`help.tsx` (fold into Settings/About).
- Clean `app.json`: remove Apple Sign-In entitlements + `usesAppleSignIn` + the
  apple-authentication plugin; rewrite `NSCameraUsageDescription` to drop the event mention;
  trim Android permissions to camera + the media-images needed for Save.
- Remove all `@tinybooth/api-types` and `@tinybooth/billing` imports.

## Phase 2 - Strip composition (inline, Skia, print DPI)

- Define the two v1 layouts inline (`src/lib/layouts.ts`): canvas size at print DPI, frame
  rects, margins, Classic two-column duplication, Quad 2x2. Pure functions, unit tested.
- Rewrite `skiaBridge` to compose from those layout defs (no `@tinybooth/strip-render`):
  decode shots, draw cropped frames, white background, snapshot to JPEG at print resolution,
  return a `file://` URI.
- Unit tests for layout math (frame counts, rects, aspect/crop) and a smoke test for the
  bridge contract.

## Phase 3 - Screens & navigation

- expo-router routes: `index` (Start), `choose-layout`, `capture`, `preview`, `settings`,
  plus the permission primer.
- **Start:** big Start, gear -> Settings, keep-awake on. **Choose layout:** Classic | Quad.
- **Capture:** reuse `CameraSurface` (front, mirrored), `CountdownOverlay`; wire sound,
  haptics, screen-flash, the ~1-2s peek, 4-shot loop, then compose and go to Preview.
- **Preview:** show strip; Print (`print.ts`), Save (`cameraRoll.ts` + in-context library
  permission), Share (`share.ts`), Redo, Done.
- **Settings:** toggles (sound/haptics/flash), countdown length, idle reset, About.
- **Permission primer:** reuse `PermissionPrimer.tsx` + `permissions.ts` (strip event copy).

## Phase 4 - Kiosk behavior

- `expo-keep-awake` while in use.
- Idle-reset hook: timer on non-capture screens, reset on tap, return to Start on timeout
  (config from Settings; "never" supported).

## Phase 5 - Settings persistence + legal

- Persist settings locally (`expo-secure-store` or async-storage; secure-store already used).
- Add `PRIVACY.md` + `TERMS.md` (offline, collects-nothing wording). Link from About.

## Phase 6 - Identity, docs, store prep

- Confirm/replace icon + splash. README: what it is, screenshots, how to run a dev build
  (Xcode/Android Studio note per ADR 0001), contributing, license.
- Privacy nutrition labels: Data Not Collected. Update `PrivacyInfo.xcprivacy`.

## Phase 7 - QA

- `tsc --noEmit` + unit tests green.
- Dev build runs on an iOS simulator/device and an Android emulator/device: full flow
  (Start -> layout -> 4-shot capture -> strip -> print/save/share), both layouts.

## After v1

Open the roadmap items in `docs/prd.md` section 12 as GitHub issues once the repo is pushed.
