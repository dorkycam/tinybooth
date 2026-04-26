# IAP, Stripe, and RevenueCat setup guide

This is the runbook Camrynn follows once she's ready to provision real product
listings. None of these steps are run by the Phase 4 agent because the spec
forbids account creation during local builds. Pricing, ids, and entitlement
keys here match `packages/billing/src/products.ts` byte-for-byte; if you
change anything here, change it there too (and re-run the billing tests).

Last updated: 2026-04-26.

---

## 1. App Store Connect (iOS)

### 1.1 Bundle id

Keep the existing `com.codesquad.tinybooth`. The new Expo app ships under the
same bundle id so existing iOS users get the update prompt instead of a new
install.

### 1.2 Enroll in the Small Business Program

Apple Small Business Program drops the commission from 30% to 15% on all paid
apps and IAP for the first $1M of yearly proceeds. New developers qualify by
default; the toggle lives in App Store Connect under "Agreements, Tax, and
Banking". This is the difference between `$10.49` net and `$12.74` net per
$14.99 Event Pass purchase, so do this before submission.

Reference: <https://developer.apple.com/app-store/small-business-program/>

### 1.3 Create the three consumable products

Open App Store Connect → Apps → TinyBooth → Features → In-App Purchases. For
each row below, create a Consumable In-App Purchase with the listed values.

| Reference name | Product id | Price | Cleared for sale |
|---|---|---|---|
| TinyBooth Strip Unlock | `com.codesquad.tinybooth.strip_unlock` | Tier 2 ($1.99) | Yes |
| TinyBooth Event Pass | `com.codesquad.tinybooth.event_pass` | Tier 15 ($14.99) | Yes |
| TinyBooth Event Pass Plus | `com.codesquad.tinybooth.event_pass_plus` | Tier 39 ($39.00) | Yes |

For each product:
- Display name: matches the product `name` field in `packages/billing`.
- Description: matches the product `description` field in `packages/billing`.
- Review screenshot: capture the in-app paywall on iPad in the corresponding
  state (mobile/(camera)/paywall.tsx or mobile/(camera)/strip-unlock.tsx).
- Review notes: "This consumable unlocks the corresponding feature in the app
  via RevenueCat. No external license keys."

### 1.4 Privacy labels

Under App Privacy in App Store Connect, declare the following data types:

- **Purchases:** Purchase History → Linked to Identity, used for App
  Functionality.
- **Identifiers:** User ID → Linked to Identity, used for App Functionality.
  (Supabase user id.)
- **Camera:** Photos or Videos → Not Linked, App Functionality. Standalone
  strips never leave the device. When tied to a paid event the user has
  explicitly opted in.
- **Email Address:** Not Linked, App Functionality (only collected when an
  account is created or a guest opts into email delivery).
- **Phone Number:** Not Linked, App Functionality (only collected for SMS
  delivery; not stored beyond delivery).

Lying on privacy labels is the fast track to enforcement action; double-check
with the latest TinyBooth source before submitting.

---

## 2. Google Play Console (Android)

### 2.1 Create the same three Managed Products

Play Console → Monetize → Products → In-app products. Create one per row:

| Product id | Name | Default price | Status |
|---|---|---|---|
| `com.codesquad.tinybooth.strip_unlock` | TinyBooth Strip Unlock | $1.99 USD | Active |
| `com.codesquad.tinybooth.event_pass` | TinyBooth Event Pass | $14.99 USD | Active |
| `com.codesquad.tinybooth.event_pass_plus` | TinyBooth Event Pass Plus | $39.00 USD | Active |

All three are **consumable** (use the `Consumable` flag in the product
metadata; reset after purchase via `consumePurchase`).

### 2.2 Service fee

Google's reduced 15% rate auto-applies for the first $1M of yearly proceeds
per developer. No toggle needed.

### 2.3 Data safety form

The Play Console Data Safety form mirrors the App Store privacy labels.
Declare the same categories: Purchases, Identifiers, Camera, Email, Phone.

---

## 3. RevenueCat dashboard

### 3.1 Create the project

- Project name: `TinyBooth`.
- Add the iOS app: bundle id `com.codesquad.tinybooth`. Upload an App Store
  Connect API key (RevenueCat → Project Settings → Apps → iOS) so RC can poll
  receipt validation.
- Add the Android app: package name `com.codesquad.tinybooth`. Upload the
  Google Play Service Account JSON (Play Console → Setup → API access).

### 3.2 Define the entitlements

Three entitlements, each named to match the `entitlement` field in
`packages/billing`:

- `strip_unlock`
- `event_pass`
- `event_pass_plus`

For each entitlement, attach the matching iOS + Android product ids from
sections 1 and 2.

### 3.3 Wire the products

For each entitlement, set "Attached Products" to the iOS + Android product
that grants it. RC then handles cross-platform restore automatically.

### 3.4 Offerings

Create one Offering called `default`. Add three Packages: `strip_unlock`,
`event_pass`, `event_pass_plus`. Attach the matching iOS + Android product to
each package.

### 3.5 Webhook

- URL: `https://tinybooth.com/api/webhooks/revenuecat`
- Authentication: pick "Authorization Header" and set the value to
  `Bearer <REVENUECAT_WEBHOOK_SECRET>` where `REVENUECAT_WEBHOOK_SECRET` is a
  64-char random hex string you generate (`openssl rand -hex 32`). Save the
  secret in Vercel as the env var of the same name.
- Or pick "HMAC SHA-256" and set the secret to the same string. The TinyBooth
  webhook handler accepts either auth mode.
- Enable every event type (the handler ignores types it doesn't recognize).

### 3.6 (Skip for now) RevenueCat Web Billing

RevenueCat Web Billing is supported but the Phase 4 implementation goes direct
to Stripe instead. Reasons documented in `apps/web/app/api/webhooks/stripe/route.ts`.
Re-evaluate once analytics across iOS + web becomes a real need.

---

## 4. Stripe

### 4.1 Account

Use a brand-new Stripe account for TinyBooth, separate from any other
projects you run (per your note in `PROMPT.md`). Once created:

- Activate live mode after Apple + Google approve the apps.
- Enable Stripe Tax (for digital goods sales tax in 30+ US states; ~$0.50/txn).

### 4.2 Products

Create two Products in the Stripe dashboard. Both Prices are one-time, USD.

| Internal product id | Stripe product id | Price |
|---|---|---|
| `event_pass` | `tinybooth_event_pass` | $12.99 (one-time) |
| `event_pass_plus` | `tinybooth_event_pass_plus` | $34.00 (one-time) |

Strip Unlock is **not** sold on the web (IAP only).

### 4.3 Webhook

- Endpoint URL: `https://tinybooth.com/api/webhooks/stripe`.
- Events to send: `checkout.session.completed`. (Phase 4 handles only this
  one; expand later if you add subscriptions.)
- Save the signing secret as `STRIPE_WEBHOOK_SECRET` in Vercel.

### 4.4 API keys

- Save the secret key as `STRIPE_SECRET_KEY` in Vercel (server only).
- Save the publishable key as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client).
  Note: Phase 4 does not currently use the publishable key (Checkout uses the
  redirect flow), but having it provisioned makes the future Elements path
  cheap.

---

## 5. Environment variables (Vercel + EAS)

### 5.1 Vercel: `apps/web` and `apps/wall`

| Name | Used for | Staging | Production |
|---|---|---|---|
| `DATABASE_URL` | Postgres / Supabase pooled connection | yes | yes |
| `DIRECT_URL` | Supabase direct connection (Prisma migrate) | yes | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Auth | yes | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth | yes | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase admin client | yes | yes |
| `R2_ACCOUNT_ID` | Cloudflare R2 | yes | yes |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | yes | yes |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | yes | yes |
| `R2_BUCKET` | Cloudflare R2 | yes | yes |
| `R2_PUBLIC_BASE` | Public CDN base for R2 | yes | yes |
| `UPSTASH_REDIS_REST_URL` | Per-IP rate limit | yes | yes |
| `UPSTASH_REDIS_REST_TOKEN` | Per-IP rate limit | yes | yes |
| `AWS_SES_REGION` | Email sender | optional | yes |
| `AWS_ACCESS_KEY_ID` | Email sender | optional | yes |
| `AWS_SECRET_ACCESS_KEY` | Email sender | optional | yes |
| `EMAIL_FROM` | Email sender | optional | yes |
| `TWILIO_ACCOUNT_SID` | SMS sender | optional | yes |
| `TWILIO_AUTH_TOKEN` | SMS sender | optional | yes |
| `TWILIO_FROM` | SMS sender (E.164) | optional | yes |
| `STRIPE_SECRET_KEY` | Stripe Checkout | yes (test) | yes (live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Elements (future) | yes | yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature | yes | yes |
| `REVENUECAT_WEBHOOK_SECRET` | RC webhook signature | yes | yes |
| `NEXT_PUBLIC_WEB_BASE_URL` | Absolute URL for redirects | `https://staging.tinybooth.com` | `https://tinybooth.com` |
| `PAIRING_SECRET` | HMAC for the booth-event QR pair flow | yes | yes |

### 5.2 EAS: `apps/mobile` (`eas.json` env block)

| Name | Used for | Staging | Production |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Auth | yes | yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth | yes | yes |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | RevenueCat (iOS public API key) | yes | yes |
| `EXPO_PUBLIC_WEB_BASE_URL` | tRPC base URL | `https://staging.tinybooth.com` | `https://tinybooth.com` |

The mobile app DOES NOT need Stripe keys (anti-steering rule keeps the iOS
app completely Stripe-free).

---

## 6. Verifying end-to-end after provisioning

1. **iOS sandbox:** sandbox tester account → buy Event Pass → confirm RC
   webhook arrives on staging → confirm event tier flips to EVENT_PASS in
   Supabase → confirm watermark gone on the next strip.
2. **Android internal track:** same flow on Play.
3. **Web Stripe (test mode):** use card `4242 4242 4242 4242` → confirm
   Stripe webhook → confirm event tier flips → confirm dashboard banner says
   "Purchase received".
4. **Apple sandbox refund:** use the App Store sandbox refund tool → confirm
   RC sends `CANCELLATION` → confirm event reverts to FREE → confirm
   `retainUntil` was shortened but never below now + 24 hours.
5. **Quota exhaustion:** create an Event Pass event, send 50 emails, confirm
   the 51st returns TOO_MANY_REQUESTS in the dashboard.

---

## 7. Apple anti-steering reminders

Per `docs/research/monetization.md` section 7.6:

- The iOS app NEVER shows "buy on web" buttons at launch. Stripe is for
  buyers who hit `tinybooth.com` directly.
- The iOS app NEVER mentions the lower web price.
- The watermark unlock is presented as IAP only. Apple 3.1.1 says digital
  unlocks must be IAP; pretending otherwise gets the app rejected.

Revisit anti-steering at month 6 with real conversion data, in light of the
post-Epic Supreme Court ruling (currently uncertain).
