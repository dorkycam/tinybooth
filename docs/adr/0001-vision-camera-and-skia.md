# 1. Capture with vision-camera, compose with Skia

Date: 2026-06-24

## Status

Accepted

## Context

TinyBooth is a photobooth app whose headline output is a printed strip (and saved/shared
copies). Capture and composition are the core of the app, and we had to pick the native
stack for both. Two realistic options:

1. **react-native-vision-camera + @shopify/react-native-skia**. Full-resolution stills
   plus a Skia image pipeline that composes the strip at print DPI. This is the stack the
   over-scoped predecessor already used and proved out (`CameraSurface`, `skiaBridge`).
2. **expo-camera + view capture** (react-native-view-shot / expo-image-manipulator).
   Simpler, runs in Expo Go so contributors can clone and run in under a minute, but the
   strip would be snapshotted from a rendered view at screen resolution.

The app is free and open source, so contributor convenience has real weight. Expo Go
support (option 2) is the single biggest convenience difference.

## Decision

Use **react-native-vision-camera** for capture and **@shopify/react-native-skia** for strip
composition. Compose at print resolution (~1200x1800 for a 4x6). Contributors run a dev
build (`npx expo run:ios` / `run:android`); the app does not target Expo Go.

The strip layout math (Classic two-column duplication, Quad 2x2, centered crop, margins) is
small enough for the two v1 layouts that we inline it in the app rather than restoring the
generalized `strip-render` package from the archive.

## Consequences

- Prints are sharp because composition happens at print DPI, not screen resolution. This is
  the whole point of a print-first app, so it drove the decision.
- No Expo Go. Contributing requires Xcode or Android Studio for the first dev build. The
  README must document this clearly so contributors are not surprised.
- Larger native footprint and the usual need to keep vision-camera, Skia, and Reanimated
  versions aligned on upgrades.
- We carry the layout math ourselves. If layouts grow well beyond v1, revisit whether the
  archived `strip-render` package is worth restoring.
