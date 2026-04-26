# iOS Privacy Manifest

Apple required a privacy manifest (`PrivacyInfo.xcprivacy`) for every new
App Store submission as of Spring 2024. This doc explains what is in
`apps/mobile/ios/TinyBooth/PrivacyInfo.xcprivacy` and which Expo / React
Native module pulls each declaration in.

References:
- [Apple: Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Apple: Required reason API list](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api)
- [Expo SDK 51 privacy manifest support](https://docs.expo.dev/guides/apple-privacy/)

## File layout

The manifest has three top-level sections:

1. **`NSPrivacyTracking` + `NSPrivacyTrackingDomains`**: We do not use any
   tracking SDK at launch. Both are set to false / empty.
2. **`NSPrivacyCollectedDataTypes`**: Every category of user data we collect.
   Mirrors the App Store privacy questionnaire in `docs/privacy-labels.md`.
3. **`NSPrivacyAccessedAPITypes`**: Every "required reason" API we (or a
   linked framework) call.

Every entry in the manifest cross-references the code path that pulled it
in. If a section here goes stale (we drop a module, add a new one), update
both the manifest and this doc together.

## Why each data type is declared

| Data type | Linked? | Tracking? | Collected by | Code path |
|---|---|---|---|---|
| Photos / Videos | No | No | Event upload (paid) | `apps/mobile/src/lib/stripDelivery.ts`, `apps/web/src/server/api/routers/strip.ts` |
| Email Address | Yes | No | Supabase Auth (host) + guest opt-in delivery | `apps/mobile/src/lib/auth.ts`, `apps/web/src/server/api/routers/event.ts` |
| Phone Number | No | No | Guest opt-in SMS delivery | `apps/web/src/server/api/routers/event.ts` |
| User ID | Yes | No | Supabase Auth | `apps/mobile/src/lib/auth.ts` |
| Purchase History | Yes | No | RevenueCat | `apps/mobile/src/lib/iap.ts` |
| Crash Data | No | No | Sentry (when wired) | TBD - tracked in `docs/launch-checklist.md` |
| Performance Data | No | No | Sentry (when wired) | TBD - tracked in `docs/launch-checklist.md` |

Standalone strips (no event association) do not transmit photos and are
therefore not in the "Photos collected" bucket. The user can verify this in
`apps/mobile/src/lib/cameraRoll.ts`: the only persistence path is
`MediaLibrary.saveToLibraryAsync` (local) plus `expo-print` (local).

## Why each required reason API is declared

| API category | Reason code | Declared by | Code path |
|---|---|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` | AsyncStorage + RevenueCat receipt cache | `@react-native-async-storage/async-storage`, `react-native-purchases` |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `C617.1` | `expo-media-library`, `@shopify/react-native-skia` | `apps/mobile/src/lib/cameraRoll.ts`, `apps/mobile/src/lib/skiaBridge.ts` |
| `NSPrivacyAccessedAPICategoryDiskSpace` | `E174.1` | Pre-save free space check | `apps/mobile/src/lib/print.ts` (planned in Phase 2 follow-up) |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `35F9.1` | `react-native-reanimated`, `react-native-purchases` monotonic clock | declared by frameworks; we propagate it |

Reasons in scope are listed in [Apple's required reason docs](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_api).
Each code maps to a one-line justification in Apple's table; we picked the
most accurate match for what the framework actually does.

## Adding a new module

Before merging a PR that adds a native module:

1. Check if the module ships its own `PrivacyInfo.xcprivacy`. Most Expo SDK
   51+ modules do; you can confirm with `find node_modules/<module>/ios -name "PrivacyInfo.xcprivacy"`.
2. If it does, you don't need to add anything. Apple aggregates child
   manifests at build time.
3. If it doesn't, look up the framework's required reason categories and
   add them to this manifest, then update this doc with the new row.

## What we deliberately do not declare

- **Active Keyboards** (`NSPrivacyAccessedAPICategoryActiveKeyboards`):
  TinyBooth does not register a custom keyboard.
- **CoreLocation**: TinyBooth does not request location. Event location
  comes from the host's manual entry on the dashboard.
- **HealthKit, Contacts, Calendar**: Not used.
- **Tracking Domains**: We do not use a tracking SDK at launch. PostHog
  product analytics are first-party (self-hosted under
  `app.posthog.tinybooth.com`) and configured with EU data residency, so
  Apple does not classify them as tracking. If we ever add a third-party
  tracking pixel (we should not), update both `NSPrivacyTracking` and
  `NSPrivacyTrackingDomains`.

## Verification before submission

1. `xcrun -find PrivacyManifest` to confirm Xcode can parse the file.
2. Apple's [App Store Connect privacy labels page](https://appstoreconnect.apple.com/apps/<app>/distribution/privacy/data-types)
   should match the data types listed here.
3. Run `xcodebuild -showBuildSettings -workspace ios/TinyBooth.xcworkspace`
   and check that `OTHER_LDFLAGS` does not include any of the
   [SDK signature requirement](https://developer.apple.com/support/third-party-SDK-requirements/)
   listed SDKs without their own privacy manifest. If it does, fail the
   submission until the SDK is updated or replaced.
