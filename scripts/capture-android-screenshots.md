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

1. Start screen, the booth at rest
2. Layout picker showing both strip layouts
3. Camera with countdown overlay
4. Photostrip preview with the delivery buttons visible
5. Settings, capture defaults section
6. Settings, kiosk section (idle return)

## Step by step

1. Install the latest preview APK on the device (run from the repo root — this
   is a single Expo app, not a monorepo):
   ```sh
   pnpm exec eas build --platform android --profile preview --local
   adb install build-output.apk
   ```
2. Launch the app. There is no seed-fixtures launch arg, so you populate real
   content by tapping through:
   - Open the app and run a full 4-shot strip so the preview screen has real
     content.
   - Leave the default layout preference on **User's choice** so the layout
     picker actually appears at the start of a session (Settings > Capture
     defaults > Default layout).
3. Capture each screen with Android Studio Device Manager (Take Screenshot
   button) or `adb`:
   ```sh
   adb shell screencap -p /sdcard/01-camera-with-countdown.png
   adb pull /sdcard/01-camera-with-countdown.png ./fastlane/screenshots/android/
   ```
4. Repeat for each device + each shot, using these filenames (the iOS side is
   also captured by hand for now — the `TinyBoothUITests` target referenced by
   `fastlane/Snapfile` has not been created yet):
   - `01-start-screen`
   - `02-layout-picker`
   - `03-camera-with-countdown`
   - `04-strip-preview-delivery`
   - `05-settings-capture-defaults`
   - `06-settings-kiosk`
5. Drop each PNG into the matching Play Console listing field. There is no
   `fastlane supply` lane for screenshots in this repo yet; use the Play
   Console UI directly.

## Caption overlay

Play Store screenshots can include their own text overlay (no Apple-style
frame requirement). Use the same six captions as iOS:

1. "A real photo booth, free and open source"
2. "Two layouts: classic strip or quad grid"
3. "Tap, count down, four photos"
4. "Print, save, or share. All on your device."
5. "Tune the countdown, flash, sound, and haptics"
6. "Kiosk mode returns to Start on its own"

If you want a quick overlay tool, [Screenshot Framer](https://github.com/Screenshot-Framer/Screenshot-Framer)
ships caption presets for both stores. There is no committed Figma template
yet.

## When to switch to Screengrab

Move this guide to a Fastlane lane once any of these is true:

- Three or more Android-only releases have shipped.
- Camrynn is hand-capturing screenshots more than twice per quarter.
- The Play Store listing has more than two locales (the manual flow does not
  scale past one).
