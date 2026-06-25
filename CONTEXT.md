# TinyBooth Context Glossary

The shared language for TinyBooth. This is a glossary, not a spec. No implementation
details. When a term here conflicts with how someone is using a word, stop and resolve it.

TinyBooth is a free, open-source (MIT) photobooth app for iOS and Android, phone and
tablet. It runs fully on-device: no accounts, no backend, no network. It is a modern
rebuild of the original 2018 PhotoBerry iOS app.

## Terms

- **Booth**: The app running in its capture role: live front camera (mirrored preview),
  ready to take a strip. v1 is front-camera only.
- **Session**: One run from tapping start through delivering the finished strip. A session
  produces exactly one Strip. After delivery the Booth returns to the start screen for the
  next guest.
- **Layout**: A template that defines how many Shots a Strip contains and how they are
  arranged. The guest picks a Layout before a Session starts. v1 Layouts: **Classic strip**
  (4 shots, two side-by-side columns, cut down the middle) and **Quad grid** (4 shots, 2x2).
  Both are 4 shots, so a Session always captures 4 Shots in v1.
- **Shot**: One captured photo within a Session. The number of Shots is set by the Layout.
- **Countdown**: The timed lead-in before each Shot (default 3s, adjustable in Settings).
  Each tick has optional sound + haptics; capture fires a shutter sound, a haptic, and a
  brief white screen-flash to light faces.
- **Peek**: The ~1-2s pause after a Shot where the just-captured photo is shown before the
  next Countdown begins. It is passive: the guest cannot accept or reject a Shot.
- **Idle reset**: If the Preview (or any non-capture screen) sees no taps for the idle
  timeout (default 30s, adjustable), the Session is discarded and the Booth returns to Start
  for the next guest. Every tap restarts the timer. The screen is kept awake while in use.
- **Strip**: The single composed image a Session produces, built by arranging the Session's
  Shots according to the Layout. ("Strip" is used even for non-strip layouts like Single.)
- **Delivery**: Getting a finished Strip to the guest from the Preview screen. v1 channels:
  **Print** (OS print dialog, AirPrint / Android print framework), **Save** (device photo
  library), **Share** (native OS share sheet). Plus **Redo** (reshoot the Session) and
  **Done** (discard and return to Start).

## Not in scope (decided)

- No Events, no shared photo wall, no guest upload, no realtime. (Existed in the
  over-scoped monorepo; archived to `../tinybooth-archive`.)
- No accounts, no auth, no Supabase.
- No payments, no IAP, no paywall, no premium tier. The app is free.
