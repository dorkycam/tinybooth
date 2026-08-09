# Store listing copy

The source of truth for the App Store and Google Play listings. Edit here, then paste into
[App Store Connect](https://appstoreconnect.apple.com) and the
[Play Console](https://play.google.com/console).

Builds and submissions are handled by EAS (`eas build`, `eas submit`) — see `eas.json`. Only
the listing itself is manual.

> Keep this accurate. Apple rejects metadata that describes features the binary does not have,
> and that is exactly what happened to the previous version of this copy: it still advertised
> paid tiers, a cloud photo wall, and a host dashboard from the pre-pivot SaaS product.

## Field limits

| Field | Limit | Notes |
|---|---|---|
| Name | 30 | |
| Subtitle | 30 | iOS only |
| Keywords | 100 | iOS only, comma-separated, no spaces after commas |
| Promotional text | 170 | iOS only, updatable without a new binary |
| Description | 4000 | |

## Name

```
TinyBooth: Photo Booth App
```

## Subtitle

```
Free iPad Booth for Parties
```

## Keywords

Third-party trademarks (Polaroid, Selphy, and similar) must stay out of this field — Apple
rejects keyword fields that use other companies' marks.

```
photobooth,photo booth,party,wedding,event,strip,ipad,airprint,birthday,booth,prints,kiosk
```

## Promotional text

```
Free and open source. Two layouts, print-resolution strips, and a kiosk mode that runs unattended. No account, no ads, and nothing ever leaves your device.
```

## Description

```
TinyBooth turns an iPad or iPhone into a real photo booth. Tap Start, count down, take 4 photos, get a printable strip. No account, no signup, no ads, no in-app purchases.

TinyBooth is free and open source, and it runs entirely on your device. There is no server behind it. Your photos never leave your phone or tablet unless you choose to save, share, or print them.

It is a rebuild of a photo booth app first released in 2018. The classic strip and the random post-photo messages are still the same ones you remember.

WHAT YOU GET
- Front camera with a mirrored preview, so guests see themselves the right way round
- Adjustable countdown (3 seconds by default), then 4 photos in a row
- Two strip layouts: the classic 4-shot strip you cut down the middle, and a 2x2 quad grid
- Pick a layout each time, or set one as your default
- 17 random encouraging messages between shots, including the original nine
- A screen flash that lights faces in dim rooms, plus the torch on devices that have one
- Optional countdown sound, shutter sound, and haptics
- Strips composed at print resolution (1200x1800, sized for a 4x6), not at screen size

DELIVERY, ALL ON DEVICE
- Print straight to a printer with AirPrint on iOS or the Android print service
- Save the strip to your photo library
- Share to Messages, Mail, AirDrop, or any app in your share sheet
- Optionally save each individual frame alongside the strip
- Hide the Save or Share button if you want a print-only booth

BUILT TO RUN UNATTENDED
- Tablet-first layout. Stand it on a tripod and walk away.
- The screen stays awake while the booth is in use
- Auto-returns to the Start screen after an idle timeout you choose, or never
- Works on iPad and iPhone, in portrait and landscape
- Light, dark, or system appearance

PRIVACY
- No accounts, no sign-in, no analytics, no trackers, no ads
- The app makes no network requests at all
- Photos are held only in memory while you take a strip, then handed to your own device's save, share, or print
- Settings stay on your device

OPEN SOURCE
TinyBooth is MIT licensed. You can read every line, build it yourself, or contribute:
https://github.com/dorkycam/tinybooth

SUPPORT
Questions, bugs, and feature requests all go to GitHub Issues:
https://github.com/dorkycam/tinybooth/issues

You take the photos. Your device does the rest.
```

## Release notes

Rewrite per release. Current text:

```
Now on Android, and rebuilt from the ground up.

New: a second layout. Alongside the classic cut-down-the-middle strip there is now a 2x2 quad grid. Pick one each time, or set a default in Settings.

New: strips are composed at print resolution, sized for a 4x6, so prints look sharp instead of screen-grabbed.

New: a screen flash that lights faces in dim rooms, plus the torch on devices that have one.

New: kiosk settings. The screen stays awake, and the booth returns to Start after an idle timeout you choose.

New: you can hide the Save or Share button for a print-only booth, and optionally keep each individual frame.

More encouraging messages between shots. The original nine are still in there, untouched.

Still free, still no account, and now fully open source under the MIT license.

Found a bug? https://github.com/dorkycam/tinybooth/issues
```

## URLs

| Field | Value |
|---|---|
| Privacy Policy | https://github.com/dorkycam/tinybooth/blob/main/PRIVACY.md |
| Support | https://github.com/dorkycam/tinybooth/issues |
| Marketing | https://github.com/dorkycam/tinybooth |

`tinybooth.com` is a parked domain — every path redirects to a registrar lander. Do not use it
for the Privacy Policy or Support URL; Apple requires both to resolve to real content.

## Categories and copyright

| Field | Value |
|---|---|
| Primary category | Photo & Video |
| Secondary category | Entertainment |
| Copyright | 2026 TinyBooth |

## Privacy questionnaire

Both stores ask what data the app collects. The answer is **none** — Apple "Data Not
Collected", Play Data Safety "No data collected". This is backed by `PRIVACY.md`,
`ios/TinyBooth/PrivacyInfo.xcprivacy` (empty `NSPrivacyCollectedDataTypes`, `NSPrivacyTracking`
false), and the absence of any network call in the codebase.

Permissions to declare: camera (required to take photos) and add-to-photo-library (only when
the guest taps Save).

## Screenshots

Not yet captured. See [capture-screenshots.md](./capture-screenshots.md) for the shot list and
the manual capture process for both platforms.
