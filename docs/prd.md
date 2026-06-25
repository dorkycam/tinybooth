# TinyBooth PRD (v1)

TinyBooth is a free, open-source (MIT) photobooth app for iOS and Android, phone and tablet.
It runs fully on-device: no accounts, no backend, no network, no payments. It is a modern,
cross-platform rebuild of the original 2018 PhotoBerry iOS app.

See `CONTEXT.md` for the glossary and `docs/adr/` for architecture decisions.

## 1. What PhotoBerry was (the source we are rebuilding)

A ~520-line native iOS app (Swift, UIKit, AVFoundation, Storyboards, the now-dead TwitterKit):

1. Single camera screen, front camera, mirrored, one "Start" button.
2. Tap Start -> 3-second countdown with a sound, take a photo, repeat to 4 photos. Button
   turned red while shooting, green when done.
3. Auto-segue to a Preview showing the composed strip.
4. Preview offered Redo and Print (AirPrint, 4x6). It also auto-tweeted every strip with a
   hardcoded party hashtag (a one-off; removed).

Strip composition (`PhotoUtil.renderPhotostrip`): 800x1200 canvas, 30px margins, 4 photos
stacked and duplicated into two side-by-side columns (cut down the middle). White background.
Photos saved as JPGs in the documents directory. No database, no network.

The essence: **open -> tap -> 4-shot countdown capture -> classic strip -> print/redo.**

## 2. Goals and non-goals

**Goals**
- Faithful, modern remake of the PhotoBooth core, cross-platform (iOS + Android, phone +
  tablet; tablet is a first-class booth surface).
- Fully offline and private: nothing leaves the device.
- Free and open source (MIT), easy for others to read, run, and contribute to.
- Print-quality strips.

**Non-goals (v1)**
- No Events, shared photo wall, guest upload, or realtime. (Existed in the over-scoped
  monorepo; archived to `../tinybooth-archive`.)
- No accounts, auth, or Supabase.
- No payments, IAP, paywall, or premium tier.
- No filters, color presets, captions, or front/back toggle in v1 (see Roadmap).

## 3. Screens and flow

```
[Start / idle]            big Start button + gear (Settings)
      v
[Choose layout]           Classic strip | Quad grid
      v
[Capture]                 live front camera + countdown + peek, x4 shots
      v
[Preview / delivery]      composed strip + Print / Save / Share / Redo / Done
      v
   back to Start          (on Done, or after idle timeout)
```

- **Start / idle:** A big Start button and a gear icon to Settings. The resting state of a
  booth on a stand. Keeps the screen awake.
- **Choose layout:** Pick Classic strip or Quad grid (both 4 shots in v1).
- **Capture:** Full-screen mirrored front-camera preview. Tap Start (or it begins on entry)
  -> Countdown (default 3s) with optional sound + haptics -> capture (shutter sound, haptic,
  brief white screen-flash) -> Peek the shot ~1-2s -> next, until 4 shots are taken. No
  per-shot accept/reject.
- **Preview / delivery:** Show the composed Strip. Actions: Print, Save to photos, Share,
  Redo (reshoot), Done (discard, return to Start). Idle timeout returns to Start.

## 4. Capture spec

- Always 4 shots in v1 (both layouts are 4-shot).
- Front camera only, mirrored preview.
- Countdown default 3s, adjustable (3 / 5 / 10) in Settings.
- Feedback: countdown + shutter sound (reusing the original app's `countdown.mp3` /
  `shutter.mp3`), haptics, white screen-flash on capture. Each is individually toggleable in
  Settings.
- Full-resolution capture via react-native-vision-camera.

## 5. Layouts (v1)

- **Classic strip:** 4 photos stacked, duplicated into two side-by-side columns, cut down the
  middle. White background, margins. Composed at print DPI (target ~1200x1800 for a 4x6).
- **Quad grid:** 4 photos in a 2x2 grid, white background, margins.

Composition is done with Skia at print resolution (see ADR 0001). Layout math is inlined for
these two layouts.

## 6. Delivery (v1)

All on-device (no backend):
- **Print:** OS print dialog (AirPrint on iOS, Android print framework) via expo-print.
- **Save:** to the device photo library (expo-media-library), permission asked in context.
- **Share:** native OS share sheet (expo-sharing) for AirDrop / Messages / Mail / social.
- **Redo:** discard and reshoot the session.
- **Done:** discard and return to Start.

## 7. Kiosk behavior (v1)

- **Keep screen awake** while the app is in use.
- **Auto-return to Start** after an idle timeout (default 30s, adjustable; "never" allowed)
  on the Preview / non-capture screens. Every tap restarts the timer; the Strip stays until
  dismissed or timed out.
- No orientation lock: the app is responsive across phone/tablet and portrait/landscape.

## 8. Settings (v1)

- Toggles: countdown + shutter sound, haptics, screen-flash.
- Countdown length (3 / 5 / 10s).
- Idle reset time (15 / 30 / 60s / never).
- About: app version, MIT license, link to the GitHub repo, "Report a problem" (GitHub
  Issues), Privacy Policy, Terms.

Settings persist locally on-device.

## 9. Permissions

- **Camera (required):** first-run primer screen explaining why, then the OS prompt.
- **Photo library (Save only):** requested in context the first time someone taps Save.

## 10. Open-source / store requirements

- **License:** MIT, at repo root.
- **Privacy Policy + Terms:** markdown in the repo, linked from About. Because the app
  collects nothing and is fully offline, the privacy policy is short and accurate. Both
  stores require a privacy policy URL even for no-data apps.
- **Issues / support:** GitHub Issues is the channel for user-submitted problems.
- **Privacy nutrition labels:** "Data Not Collected" on both stores.

## 11. Architecture (summary; details in ADR 0001)

- Single Expo app, flattened from the old monorepo (no turbo, no pnpm workspaces). App lives
  at the repo root; theme colors inlined as a local `src/theme` module.
- expo-router for navigation.
- react-native-vision-camera (capture) + @shopify/react-native-skia (composition at print
  DPI). Runs via dev build, not Expo Go.
- expo-print (print), expo-media-library (save), expo-sharing (share), expo-haptics, expo-
  audio (sounds), expo-keep-awake (screen awake), local persistence for settings.
- Reuse the proven local modules from the existing app (`CameraSurface`, `CountdownOverlay`,
  `skiaBridge`, `print.ts`, `share.ts`, `cameraRoll.ts`, `sounds.ts`, `permissions.ts`,
  `PermissionPrimer.tsx`, theme). Delete all SaaS code (auth/Supabase, IAP/billing/paywall,
  events/wall, api-client/api-types).

## 12. Roadmap (post-v1, tracked as GitHub issues)

- Strip color presets (theme-palette borders/backgrounds).
- Photo filters (B&W / Sepia / Warm).
- Caption / footer text on the strip.
- Front/back camera toggle.
- Additional layouts: Trio (3 shots), Single (1 shot).
- Possibly: settings-configurable default layout, fuller kiosk lock.
