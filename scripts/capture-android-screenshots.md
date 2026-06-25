# Capturing Play Store screenshots manually (first launch)

We do not run Fastlane Screengrab for the first Play Store submission. Wiring
Espresso + Screengrab against the Expo native target is more setup than the
Play Console requires for an internal launch, and Play accepts hand-captured
PNGs at the same resolution.

This guide is the manual fallback. Once we have repeat Android releases,
revisit moving to Screengrab so the lane matches `fastlane screenshots` on
iOS.

## What Play Console wants

Per the [Play Console listing requirements](https://support.google.com/googleplay/android-developer/answer/9866151):

| Asset | Required? | Spec |
|---|---|---|
| Phone screenshots | Yes (2 to 8) | 16:9 or 9:16, min 320 px, max 3840 px on the long side |
| 7-inch tablet | No, recommended | 16:9 or 9:16, min 320 px, max 3840 px |
| 10-inch tablet | No, recommended | 16:9 or 9:16, min 1080 px on the long side |
| Feature graphic | Yes | 1024 x 500 PNG or JPG, no transparency |

Order matters; the first phone screenshot is the one most users see.

## Devices to capture

Mirror the iOS Snapfile so the listings tell the same story:

- Pixel 7 (1080 x 2400)        # phone hero
- Pixel Tablet (2560 x 1600)   # 10-inch tablet hero
- Pixel 6 (1080 x 2400)        # compat fallback

Each device gets the same six shots as iOS:

1. Camera with countdown overlay
2. Photostrip preview with the print button visible
3. Layout picker showing the five strip layouts
4. Connect to event flow (event slug + QR)
5. Event branding applied to a strip
6. Help screen with the Guided Access setup section

## Step by step

1. Install the latest preview APK on the device:
   ```sh
   cd apps/mobile
   pnpm exec eas build --platform android --profile preview --local
   adb install build-output.apk
   ```
2. Launch the app. The seed-fixtures launch arg is not wired on Android yet,
   so you populate fixture data by tapping through:
   - Open the app, take 4 photos so the preview screen has real content.
   - In Settings, set the default layout to `1x4 classic` then take another
     strip for the layout picker shot.
3. Capture each screen with Android Studio Device Manager (Take Screenshot
   button) or `adb`:
   ```sh
   adb shell screencap -p /sdcard/01-camera-with-countdown.png
   adb pull /sdcard/01-camera-with-countdown.png ./fastlane/screenshots/android/
   ```
4. Repeat for each device + each shot. Use the same filenames as the iOS
   tests in `ios/TinyBoothUITests/TinyBoothUITests.swift`:
   - `01-camera-with-countdown`
   - `02-strip-preview-print`
   - `03-layout-picker`
   - `04-connect-to-event`
   - `05-event-branding`
   - `06-help-guided-access`
5. Drop each PNG into the matching Play Console listing field. There is no
   `fastlane supply` lane for screenshots in this repo yet; use the Play
   Console UI directly.

## Caption overlay

Play Store screenshots can include their own text overlay (no Apple-style
frame requirement). Use the same six captions as iOS:

1. "Real photo booth, free on iPad and Android"
2. "Print classic 1x4 photo strips"
3. "Five strip layouts, 1x4 to 2x2"
4. "Connect the booth to your event"
5. "Branded strips for weddings and parties"
6. "Guided Access keeps the booth on one screen"

If you want a quick overlay tool, [Screenshot Framer](https://github.com/Screenshot-Framer/Screenshot-Framer)
ships caption presets for both stores. Otherwise the Figma file at
`docs/brand/assets/store-frames.fig` (TODO: build this when designer pass
runs) has the layered template.

## When to switch to Screengrab

Move this guide to a Fastlane lane once any of these is true:

- Three or more Android-only releases have shipped.
- Camrynn is hand-capturing screenshots more than twice per quarter.
- The Play Store listing has more than two locales (the manual flow does not
  scale past one).
