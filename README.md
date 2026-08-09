# TinyBooth

A free, open-source photobooth app for iOS and Android, phone and tablet. Tap
Start, take a 4-shot countdown sequence, and get a classic printed strip. It runs
fully on-device: no accounts, no backend, no network, no payments.

TinyBooth is a modern, cross-platform rebuild of the original 2018 PhotoBerry iOS
app (~900 lines of Swift: front camera, 4-shot countdown, classic strip,
AirPrint). This version keeps that core and brings it to Android and tablets.

## What it does

- **One-tap booth.** A big Start button and a gear for Settings. The resting
  state of a booth on a stand. The screen stays awake while in use.
- **Two layouts.** Classic strip (4 shots in two side-by-side columns, cut down
  the middle) and Quad grid (4 shots in a 2x2). Both are 4 shots.
- **Countdown capture.** Front camera, mirrored preview. A countdown (default 3s,
  adjustable) with optional sound and haptics, a shutter sound, a haptic, and a
  brief white screen-flash to light faces. A short peek of each shot, then the
  next. Four shots, no per-shot accept or reject.
- **Print-quality strips.** Composition runs through Skia at print DPI (target
  ~1200x1800 for a 4x6), not at screen resolution.
- **On-device delivery.** Print (AirPrint on iOS, Android print framework), Save
  to your photo library, Share to the native share sheet, Redo, or Done.
- **Kiosk friendly.** Keeps the screen awake and auto-returns to Start after an
  idle timeout (adjustable, or never). Responsive across phone, tablet, portrait,
  and landscape.
- **Private by design.** Nothing leaves the device. No analytics, no trackers, no
  ads. See [PRIVACY.md](./PRIVACY.md).

## Screenshots

_Screenshots coming soon._

<!-- Add captures of: Start, Choose layout, Capture countdown, Preview/delivery. -->

## Run it

TinyBooth needs a **dev build**. It does **not** run in Expo Go.

The capture and composition pipeline uses
[react-native-vision-camera](https://github.com/mrousavy/react-native-vision-camera)
for full-resolution stills and
[@shopify/react-native-skia](https://github.com/Shopify/react-native-skia) to
compose the strip at print resolution. Both are native modules that Expo Go does
not include, so you build the app once with the native toolchain.

### Prerequisites

- Node 20 (`nvm use`)
- pnpm 9 (`corepack enable pnpm`)
- For iOS: Xcode and CocoaPods on a Mac
- For Android: Android Studio with an SDK and an emulator or a device

### Steps

```sh
pnpm install

# iOS (builds the native app, then launches it)
pnpm ios

# Android
pnpm android
```

`pnpm ios` and `pnpm android` run `expo run:ios` / `expo run:android`, which build
the native project and start the dev server. After the first build you can launch
the dev server on its own with `pnpm start`.

### Quality checks

```sh
pnpm typecheck   # tsc --noEmit
pnpm test        # vitest
pnpm lint        # eslint
```

## Contributing

Contributions are welcome. A few notes:

- This is a single Expo app at the repo root (no monorepo, no workspaces). Routes
  live in `app/` (expo-router), shared code in `src/`.
- TypeScript is strict. No `any`. Exported functions get explicit return types and
  JSDoc.
- Mobile colors come from `useTheme()` in `src/theme/`. Do not hardcode hex values
  in component code.
- Run `pnpm typecheck`, `pnpm test`, and `pnpm lint` before opening a pull request.
- Found a bug or have a request? Open an issue:
  https://github.com/dorkycam/tinybooth/issues

The roadmap (post-v1 ideas like filters, captions, more layouts, and a front/back
camera toggle) is tracked in
[GitHub Issues](https://github.com/dorkycam/tinybooth/issues).

## License

MIT. See [LICENSE](./LICENSE).

- [Privacy Policy](./PRIVACY.md)
- [Terms of Use](./TERMS.md)
- [Contributing](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
