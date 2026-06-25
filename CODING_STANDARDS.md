# TinyBooth Coding Standards

The contributor-facing rulebook for TinyBooth's source code. This expands on the hard rules in
[AGENTS.md](./AGENTS.md). Where a rule is already enforced today it's marked **(existing)**;
newly adopted rules are marked **(new)**. AGENTS.md stays canonical for commits, security, and
writing style; this doc goes deeper on architecture, components, hooks, types, and testing.

TinyBooth is a single offline Expo app: no backend, no accounts, no network. Any rule that
mentions servers, GraphQL, a Redux server cache, or auth is intentionally **out of scope** and
noted as such at the end.

---

## Architecture & file organization

- **Keep the file tree flat. (existing)** No folder that only wraps a single file with an
  `index.ts`. Create a subfolder only when 3+ files genuinely belong together (e.g.
  `src/theme/tokens/`). **(new: the "3+ files" threshold)**
- **No barrel / `index.ts` re-export files. (new)** Import each symbol directly from its source
  path. Barrels invite circular imports and hide an import's true origin.
  ```ts
  import { PrimaryButton } from '@/components/PrimaryButton'; // yes
  import { PrimaryButton } from '@/components';                // no
  ```
- **Route files stay thin. (new)** Files under `app/` (expo-router) wire up navigation and
  compose a screen; the real implementation lives in `src/`. A route should mostly read params,
  call hooks, and render components. Today's screens are close to this; keep them moving that way.
- **Shared dirs are for generic, app-agnostic code only. (new)** `src/components`, `src/hooks`,
  and `src/lib` hold things any unrelated screen could use unchanged (UI primitives, device
  wrappers, pure utilities). Litmus test before adding a file: *"Would an unrelated screen use
  this as-is?"* If no, keep it next to the feature that owns it.
- **Cross-cutting infra lives in its own top-level `src/` folder. (existing)** Current layout to
  preserve:
  - `src/theme/` — tokens, `ThemeContext`, `useTheme`.
  - `src/lib/` — low-level device wrappers (camera roll, file system, print, share, sounds,
    haptics, secure store, Skia bridge) plus pure utilities. TinyBooth's "utilities + device
    adapters" home.
  - `src/hooks/` — generic, domain-free hooks.
  - `src/components/` — reusable UI primitives.
- **File naming by role. (existing)** PascalCase for components/screens
  (`CountdownOverlay.tsx`), camelCase for hooks and utilities (`useSettings.ts`, `layouts.ts`).
  Hooks are always `useX.ts`. Per-feature constants/types files are named `constants.ts` /
  `types.ts`.
- **If a flow grows, group it as a flat module. (new, future)** TinyBooth is small enough today
  that flat `src/components` + `src/lib` is correct. If a flow (capture, strip layout, filters,
  export) accumulates several screen-specific components + hooks + helpers, colocate them in one
  flat `src/<feature>/` folder rather than scattering across type-folders. Don't pre-create empty
  module folders.

---

## Imports & path aliases

- **Use the `@/*` alias for cross-area imports. (existing — already wired)** `tsconfig.json`
  maps `@/* -> src/*`. Use `@/` for anything outside the current folder; reserve relative `./`
  for same-folder imports. No deep `../../../` chains.
  ```ts
  import { useTheme } from '@/theme/useTheme';     // cross-area
  import { stripLayoutLabel } from './layouts';    // same folder
  ```
- **Import order. (new — house convention)**
  1. React / framework
  2. External libraries
  3. Internal absolute (`@/…`)
  4. Relative (`./…`)
  5. Type-only imports (`import type …`)
- **Metro rule. (existing)** Never `import(variableName)`. Dynamic imports need a static string
  literal: `await import('expo-haptics')`.

---

## Components & styling

- **One component per file. (existing)** Screens ≤ 300 lines, components ≤ 200; extract any
  inline component over ~30 lines.
- **Library-style components. (existing)** Data and callbacks come in as props. No data access
  and no hardcoded navigation (`router.push`) inside presentational components — the parent/route
  owns that.
- **Named function + explicit return type + a `XProps` interface. (existing/new)** Colocate the
  props interface directly above the component.
  ```ts
  interface CountdownOverlayProps {
    digit: number | null;
    message: string | null;
  }

  export function CountdownOverlay({ digit, message }: CountdownOverlayProps): JSX.Element | null {
    // ...
  }
  ```
- **Derive wrapper props from the wrapped primitive. (new)** When wrapping an RN/Expo component,
  `extends` / `Omit` / `Pick` its prop type instead of re-typing a subset, so consumers keep the
  full native surface and the wrapper can't drift.
  ```ts
  interface BoothImageProps extends Omit<ImageProps, 'source'> { uri: string; }
  ```
- **Wrap each third-party / native primitive behind one project component. (new)** Defaults,
  theme tokens, and library quirks live in one chokepoint; never sprinkle the raw library
  component across screens. `CameraSurface` (around `react-native-vision-camera`) and
  `GlassSurface` (around `expo-glass-effect`) are the model — keep new native usage behind a
  single wrapper.
- **Theme tokens only. (existing)** Never hardcode hex, font sizes, spacing, or radii in
  component code. Pull from `useTheme()`; tokens live in `src/theme/tokens/`. A drop-shadow
  `rgba()` (a visual effect, not a fill color) is acceptable.
- **Style with `StyleSheet.create`; append the caller's `style` last. (new)** Compose as an
  array and gate variant overrides with boolean short-circuits so callers can always override.
  ```ts
  const styles = StyleSheet.create({ root: {/*…*/}, disabled: {/*…*/} });
  // in render:
  style={[styles.root, disabled && styles.disabled, props.style]}
  ```
- **Express variants as thin named exports over a shared helper. (existing)** Prefer
  `PrimaryButton` / `SecondaryButton` (the current pattern) that share one private helper + a
  per-variant style, over a mega-component with internal `if` branches.
- **Reusable list/group components are generic and data-driven. (existing/new)** Take an
  `options`/`items` array prop and a typed `onChange`/`onPress<T>` callback; never hardcode data
  or navigation inside (see `SegmentedChoice`).
  ```ts
  interface OptionPickerProps<T> { options: { label: string; value: T }[]; onChange: (value: T) => void; }
  ```
- **Thin screens, dumb components. (existing/new)** Screens own state + hooks and compose
  components; components receive ready data + callbacks. Use children composition over
  prop-drilling duplicated layout.

---

## Hooks & state

- **Multi-value hooks return a memoized, typed object; tuples only for trivial on/off state.
  (new)** Wrap the return in `useMemo` with every field in the deps so consumers get a stable
  value. Give every hook an explicit return type and a JSDoc summary.
  ```ts
  interface Countdown { seconds: number; start: () => void; reset: () => void; }
  export function useCountdown(from: number): Countdown {
    // ...
    return useMemo(() => ({ seconds, start, reset }), [seconds, start, reset]);
  }
  ```
- **Build tiny single-responsibility hooks and compose. (new)** Prefer small primitives
  (`useBooleanState`, a debounced setter) and build flow hooks from them instead of re-writing
  `useState`/`useCallback` boilerplate.
- **Access shared singletons through a Context + a guard hook that throws. (existing/new)** Wrap
  app-wide services (settings/persistence, media-library/file-system, a logger) behind a Context
  and a hook that throws if used outside its provider, so screens never reach into
  `expo-file-system` / `expo-secure-store` directly and the dep is mockable. `ThemeContext`/
  `useTheme` and `useSettings` are the model.
  ```ts
  export function useSettings(): SettingsStore {
    const store = useContext(SettingsContext);
    if (!store) throw new Error('useSettings must be used within a SettingsProvider');
    return store;
  }
  ```
- **Disciplined effects: guard async work and always clean up. (new)** Use a local
  `let ignore = false` closed over by the cleanup to drop stale async resolutions under
  StrictMode and fast screen transitions (critical for camera/permission/file-read effects).
  ```ts
  useEffect(() => {
    let ignore = false;
    getCameraPermissionStatus().then((res) => { if (!ignore) setStatus(res); });
    return () => { ignore = true; };
  }, []);
  ```
- **Never swallow side-effect failures. (existing)** Offline apps still fail (storage full,
  permission denied, codec errors). Fire-and-forget promises end in `.catch(...)` that surfaces
  the error; async callbacks throw `Error`s with context. No empty `catch {}`.
- **Business logic lives in hooks and pure module-level helpers; screens stay thin.
  (existing/new)** Hoist pure functions (layout math, file naming, countdown timing) to module
  scope so they're stable, kept out of dep arrays, and unit-testable without rendering.

---

## TypeScript conventions

- **TypeScript strict, no `any`. (existing)** Use `unknown` and narrow. No `@ts-ignore` /
  `@ts-expect-error` unless a genuine library bug has no workaround. `strict` and
  `noUncheckedIndexedAccess` are on.
- **Explicit return types + JSDoc on every export. (existing)** `{@link}` cross-references in
  JSDoc are encouraged.
- **String-literal unions via `as const` array + indexed access, not `enum`. (existing/new)** One
  source of truth that is both a runtime array (to render pickers) and a compile-time union.
  ```ts
  export const STRIP_LAYOUTS = ['classic', 'quad'] as const;
  export type StripLayout = (typeof STRIP_LAYOUTS)[number];
  ```
- **`interface` for named/extendable shapes; `type` for unions, function signatures, and
  computed/utility types. (new)** Name prop interfaces `<Component>Props`, colocated above the
  component.
- **Derive related types with `Pick` / `Omit` / `Partial` / `Required` rather than re-declaring
  fields. (new)** Add a generic helper to a small `src/types.ts` only once it's needed in 2+
  places — don't pre-build a utility-type library.
- **Model variant state as a discriminated union, not one wide optional bag. (new)** A single
  literal discriminant makes impossible states unrepresentable.
  ```ts
  type CaptureState =
    | { kind: 'get-ready' }
    | { kind: 'countdown'; secondsLeft: number }
    | { kind: 'reveal'; uri: string }
    | { kind: 'composing' };
  ```
- **Use `as const satisfies <Type>` on literal config. (new)** Validates shape against a contract
  while preserving narrow literal inference. Good for theme tokens and layout manifests.

---

## Testing

- **Runner: `vitest run` (`pnpm test`). (existing)** Tests live in `__tests__/` and import the
  unit under test via `@/…` or a relative path.
- **Concentrate tests on pure logic, not UI. (existing/new)** Cover edge cases exhaustively
  (NaN, empty string, null, nested shapes). The real risk in an offline app is pure helpers —
  strip layout math, file naming, countdown timing — so put that logic behind pure functions that
  test without the camera.
- **No render/snapshot tests as the backbone. (new)** A testing-library render test is fine for a
  rare genuinely-interactive component, but it isn't the default.
- **Keep logic testable by design. (new)** If something needs the camera, file system, or a
  timer to test, the logic is in the wrong place — extract the deterministic part.

---

## Tooling & DX / contributing

- **One single-purpose script per quality gate, split into check vs fix. (existing/new)**
  `typecheck` (`tsc --noEmit`), `lint` (add `lint:fix`), `format:check` / `format`, `test`. The
  fixer mutates files; the checker is CI-safe.
- **The linter enforces the style guide mechanically. (existing)** The flat config
  (`@eslint/js` recommended + `typescript-eslint` recommended) already bans `any`
  (`@typescript-eslint/no-explicit-any: 'error'`), errors on unused vars with an `_`-prefixed
  escape hatch, warns on missing exported-function return types, and limits `console`. Keep new
  rules in that flat config.
- **Pinned, commented Prettier config. (new)** Add a small committed config and annotate
  non-default choices in one line (`printWidth`, `singleQuote`, `trailingComma: 'all'`,
  `arrowParens: 'always'`). Pair with `format` / `format:check`.
- **Commit editor settings. (new)** Add `.vscode/settings.json` wiring format-on-save → Prettier
  and `source.fixAll.eslint` on save, so a fresh clone formats correctly with zero setup.
- **CI runs the same scripts as ordered, named steps. (existing)** Install with pnpm
  `--frozen-lockfile` and pnpm cache, then run `typecheck` → `lint` → `test` as separate steps on
  every PR to `main`. CI invokes the scripts, never reimplements the commands inline.
- **Pin the toolchain. (existing)** `engines` pins node `>=20` and pnpm `>=9`, `packageManager`
  pins `pnpm@9.15.0`, and `.nvmrc` pins the node version. Reference the same node version in CI.
- **Conventional Commits + PR to `main`. (existing)** `feat:`/`fix:`/`chore:`/`refactor:`/
  `docs:`/`test:`, scope when useful. Run `pnpm typecheck` and `pnpm test` before committing.
- **Never commit secrets. (existing)** No API keys, signing material, `.env`, or service-account
  JSON in any tracked file. The `gitleaks` pre-commit hook and CI secret-scan stay on — don't
  bypass with `--no-verify`.

---

### Out of scope (and why)

TinyBooth is offline OSS with no backend, so these reference patterns are intentionally **not**
adopted: server/data-cache layers (Redux server cache, Apollo/GraphQL clients), GraphQL
operations and codegen, JWT/auth, remote error-reporting that needs an account, private-registry
credentials, and any networking layer. Don't add networking, accounts, or payments without
opening an issue first (per AGENTS.md scope).
