# Capturing store screenshots

Screenshots are captured by hand for both stores and uploaded through App Store Connect and
the Play Console directly.

There is no screenshot automation in this repo. EAS handles builds and submissions
(`eas build`, `eas submit`), but it does not upload screenshots, and both stores accept
hand-captured PNGs at the right resolution. Automating this (Fastlane `snapshot` on iOS,
Screengrab on Android) means wiring a UI test target against the Expo native project, which is
more setup than a one-locale listing justifies. Revisit if the listing grows past one locale or
you find yourself recapturing more than a couple of times a quarter.

The listing text lives in [store-listing.md](./store-listing.md).

## What the stores want

### App Store

Per [Apple's specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/):

| Asset | Required? | Spec |
|---|---|---|
| iPhone 6.9" or 6.5" | Yes | One set covers all iPhone sizes |
| iPad 13" or 12.9" | Yes, if the app supports iPad | TinyBooth does, so this is required |

Up to 10 per device size. The first two are what show in search results.

### Play Console

Per the [Play Console listing requirements](https://support.google.com/googleplay/android-developer/answer/9866151):

| Asset | Required? | Spec |
|---|---|---|
| Phone screenshots | Yes (2 to 8) | 16:9 or 9:16, min 320 px, max 3840 px on the long side |
| 7-inch tablet | No, recommended | 16:9 or 9:16, min 320 px, max 3840 px |
| 10-inch tablet | No, recommended | 16:9 or 9:16, min 1080 px on the long side |
| Feature graphic | Yes | 1024 x 500 PNG or JPG, no transparency |

Order matters; the first phone screenshot is the one most users see.

## Devices to capture

Keep both listings telling the same story.

**iOS**

- iPhone 16 Pro Max (6.9")  — phone hero
- iPad Pro 13" — tablet hero, required because the app supports iPad

**Android**

- Pixel 7 (1080 x 2400) — phone hero
- Pixel Tablet (2560 x 1600) — 10-inch tablet hero

## The six shots

TinyBooth is tablet-first, so capture the tablet set in landscape and the phone set in
portrait.

1. Start screen, the booth at rest
2. Layout picker showing both strip layouts
3. Camera with countdown overlay
4. Photostrip preview with the delivery buttons visible
5. Settings, capture defaults section
6. Settings, kiosk section (idle return)

Filenames:

- `01-start-screen`
- `02-layout-picker`
- `03-camera-with-countdown`
- `04-strip-preview-delivery`
- `05-settings-capture-defaults`
- `06-settings-kiosk`

## Step by step

1. Get a build onto the device. Run from the repo root — this is a single Expo app, not a
   monorepo.

   ```sh
   # Android
   pnpm exec eas build --platform android --profile preview --local
   adb install build-output.apk

   # iOS: build to a simulator or device, then capture there
   pnpm ios
   ```

2. Set up real content. There is no seed-fixtures launch arg, so tap through it:
   - Run a full 4-shot strip so the preview screen has real content.
   - Leave the default layout preference on **User's choice** so the layout picker actually
     appears at the start of a session (Settings > Capture defaults > Default layout).

3. Capture.

   ```sh
   # Android, via adb
   adb shell screencap -p /sdcard/01-start-screen.png
   adb pull /sdcard/01-start-screen.png ./screenshots/android/

   # iOS simulator
   xcrun simctl io booted screenshot ./screenshots/ios/01-start-screen.png
   ```

   Android Studio's Device Manager has a Take Screenshot button that works just as well.

4. Upload through App Store Connect and the Play Console directly.

`screenshots/` is gitignored — these are large binaries, regenerable, and the stores hold the
canonical copy.

## Caption overlay

Both stores allow a text overlay on the image. Captions matching the six shots:

1. "A real photo booth, free and open source"
2. "Two layouts: classic strip or quad grid"
3. "Tap, count down, four photos"
4. "Print, save, or share. All on your device."
5. "Tune the countdown, flash, sound, and haptics"
6. "Kiosk mode returns to Start on its own"

[Screenshot Framer](https://github.com/Screenshot-Framer/Screenshot-Framer) ships caption
presets for both stores. There is no committed Figma template.
