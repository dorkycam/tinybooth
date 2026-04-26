# Privacy labels: App Store + Play Console

Pre-filled answers to the App Privacy questionnaire (App Store Connect) and
the Data Safety form (Google Play Console). Each row maps to the code path
that justifies it. Lying on these forms is a fast track to Apple / Google
enforcement, so keep this doc in lockstep with the actual data flows.

Last updated: 2026-04-26.

References:
- [Apple App Privacy details](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)

## 1. Summary

| Label | Apple bucket | Play bucket |
|---|---|---|
| Camera (photo content of standalone strips) | not collected | not collected |
| Camera (photo content of event uploads, paid only) | Data Not Linked to You | shared (encrypted in transit, deleted on retention timer) |
| Email (host accounts) | Data Linked to You | collected (linked) |
| Email (guest delivery opt-in) | Data Not Linked to You | collected (not linked) |
| Phone (guest SMS delivery opt-in) | Data Not Linked to You | collected (not linked) |
| User ID (Supabase auth id) | Data Linked to You | collected (linked) |
| Purchase History (RevenueCat) | Data Linked to You | collected (linked) |
| Crash + Performance Data (Sentry) | Data Not Linked to You | collected (not linked) |
| Tracking | none | none |

Standalone strips never leave the device. The camera is on, but the photo
content is not "collected" by Apple's definition because the developer
(us) never receives it. We document this in the App Privacy reviewer
notes.

## 2. App Store Connect: questionnaire

Apple's questionnaire has three top-level sections plus per-data-type
follow-ups. Pre-filled below.

### 2.1 Data Used to Track You

- **None.** TinyBooth does not use any third-party tracking SDK at launch.
  PostHog product analytics (when wired) are configured for first-party,
  EU data residency with anonymized device ids; per Apple's definition,
  that is not tracking.

### 2.1a Third-Party AI Disclosure (Guideline 5.1.2(i), Nov 13, 2025)

- **None.** TinyBooth does not share personal data with any third-party
  AI service. There is no OpenAI, Google Gemini, Anthropic Claude, or
  Apple Intelligence integration in the launch build. The static random
  message library in `packages/messages/` is on-device only; no model
  inference happens. If we add any AI feature later, this section must be
  updated AND the in-app consent flow must ship before the data leaves
  the device.

### 2.2 Data Linked to You

| Data type | Used for | Code path |
|---|---|---|
| Email Address | App Functionality, Account Management | `apps/mobile/src/lib/auth.ts` (Apple, Google, magic link), `packages/auth/`, `apps/web/src/server/api/routers/account.ts` |
| User ID | App Functionality, Authentication | `apps/mobile/src/lib/auth.ts` (Supabase auth user id) |
| Purchase History | App Functionality | `apps/mobile/src/lib/iap.ts`, `apps/web/src/server/api/webhooks/revenuecat/route.ts` |

### 2.3 Data Not Linked to You

| Data type | Used for | Code path |
|---|---|---|
| Photos (event uploads only) | App Functionality | `apps/mobile/src/lib/stripDelivery.ts`, `apps/web/src/server/api/routers/strip.ts`, `apps/wall/app/[slug]/upload/page.tsx` |
| Email Address (guest delivery only) | App Functionality | `apps/web/src/server/api/routers/event.ts` (delivery quotas) |
| Phone Number (guest SMS delivery only) | App Functionality | `apps/web/src/server/api/routers/event.ts` |
| Crash Data | App Functionality | Sentry, when wired (tracked in `docs/launch-checklist.md`) |
| Performance Data | Analytics | Sentry, when wired (tracked in `docs/launch-checklist.md`) |

### 2.4 Per-data-type answers

Apple drills into each data type with a few yes/no follow-ups. The pre-filled
answers:

| Data type | Used for tracking? | Linked to identity? | Purposes |
|---|---|---|---|
| Photos (event) | No | No | App Functionality |
| Email (host) | No | Yes | App Functionality, Account Management |
| Email (guest) | No | No | App Functionality |
| Phone (guest) | No | No | App Functionality |
| User ID | No | Yes | App Functionality, Authentication |
| Purchase History | No | Yes | App Functionality |
| Crash Data | No | No | App Functionality |
| Performance Data | No | No | Analytics |

### 2.5 Reviewer notes (paste into App Store Connect "Notes")

```
TinyBooth has two distinct camera modes:

1. Standalone (default): photos never leave the device. Saved to Camera
   Roll and/or AirPrinted. The developer never receives them.

2. Event mode (host taps "Connect to event" and signs in): photos are
   uploaded to the host's event for the dashboard and the TinyWall TV
   display. Retention is 7 days for free events and up to 90 days for
   paid events; users can shorten this in the dashboard.

Guest uploads to the photo wall (TinyWall) happen entirely on the web
(tinybooth.com/wall/{slug}/upload). Guests never download an app and
never see Apple's IAP system. The host paid via IAP; the guests are
end-recipients of the service the host purchased. See docs/research/
monetization.md section 7.8.

Sign in with Apple is offered as a peer to Google Sign-In and email
magic link, per Guideline 4.8. Account deletion is in-app under
Settings -> Account -> Delete account, per Guideline 5.1.1(v). See
docs/account-deletion-audit.md for the cascade details.

The privacy manifest at apps/mobile/ios/TinyBooth/PrivacyInfo.xcprivacy
declares all required reason API usage. See docs/privacy-manifest.md.
```

## 3. Play Console Data Safety form

Google's form maps to similar categories with slightly different bucketing.

### 3.1 Data collection and security

- **Is all of the user data collected by your app encrypted in transit?**
  Yes. All API calls use HTTPS; R2 uploads are HTTPS via signed URLs.
- **Do you provide a way for users to request that their data is deleted?**
  Yes. In-app via Settings -> Account -> Delete account. Web via
  `/dashboard/account`. See `docs/account-deletion-audit.md`.

### 3.2 Data types collected

| Data category | Data type | Collected? | Shared? | Required? | Purpose |
|---|---|---|---|---|---|
| Personal info | Email address | yes | no | optional | Account management, app functionality |
| Personal info | User IDs | yes | no | required | Authentication |
| Personal info | Phone number | yes | no | optional | App functionality (guest SMS opt-in) |
| Photos and videos | Photos | yes (event) | no | optional | App functionality |
| Photos and videos | Photos | no (standalone) | n/a | n/a | n/a |
| Financial info | Purchase history | yes | no | required (when purchasing) | App functionality |
| App activity | Crash logs | yes | no | optional | App functionality |
| App activity | Diagnostics | yes | no | optional | Analytics |
| Device or other IDs | Device or other IDs | no | n/a | n/a | n/a |

### 3.3 Data security practices

- Encrypted in transit: yes (TLS 1.2+ everywhere).
- Encrypted at rest: yes (Supabase Postgres encrypted; R2 server-side
  encrypted; iOS Keychain for the auth session via expo-secure-store).
- Users can request data deletion: yes, in-app.

## 4. Per-data-type code-path index

Use this when the App Store / Play Console form changes and you need to
re-verify a single data type.

### Email Address

- **Host signin:** `apps/mobile/src/lib/auth.ts` (Apple/Google/magic link
  via Supabase Auth). Stored in `User.email` (`apps/web/prisma/schema.prisma`).
- **Guest delivery opt-in:** captured in TinyBooth booth preview
  (`apps/mobile/src/components/DeliveryPanel.tsx`) and in the TinyWall
  upload page. Sent via SES / Twilio in
  `apps/web/src/server/api/routers/event.ts`. Not persisted.

### Phone Number

- **Guest SMS opt-in only.** Captured at the same panel as email. Not
  persisted past delivery.

### User ID

- Supabase auth user id. Stored in `expo-secure-store` on device
  (`apps/mobile/src/lib/secureStore.ts`) and in cookies on web
  (`apps/web/src/app/dashboard/`).

### Purchase History

- RevenueCat customer info, mirrored into our `Purchase` table via the
  webhook at `apps/web/src/app/api/webhooks/revenuecat/route.ts`.

### Photos (event mode)

- Upload pipeline: `apps/web/src/app/api/upload/route.ts`, scoped to the
  authenticated event. Storage in R2 under `events/{eventId}/...`.
  Deleted by `apps/web/src/app/api/cron/cleanup/route.ts` once
  `Event.retainUntil < now()`.

### Photos (standalone mode)

- Stays on device. Camera roll save:
  `apps/mobile/src/lib/cameraRoll.ts`. Print pipeline:
  `apps/mobile/src/lib/print.ts`. Neither path emits a network request
  with the photo.

### Crash + Performance

- Sentry integration TBD (line item in `docs/launch-checklist.md`).
  When added, Sentry's own privacy manifest covers its data
  collection. We declare it on our form anyway because the SDK ships
  with our binary.

## 5. Updating this doc

When a new feature is merged that touches data collection:

1. Update the row in section 2.4 (Apple) and section 3.2 (Play).
2. Add or update the code path reference in section 4.
3. If the change adds a new data type, also update
   `apps/mobile/ios/TinyBooth/PrivacyInfo.xcprivacy` and
   `docs/privacy-manifest.md`.
4. Re-publish the app's privacy info in App Store Connect and Play
   Console as part of the next release.
