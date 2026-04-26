# TinyBooth + TinyWall Master Plan

Last updated: 2026-04-26
Author: planning pass for Camrynn
Status: source of truth, supersedes individual research docs where they conflict.

## 1. North star

TinyBooth is the only brand selling a tablet-first photobooth app and a no-app guest photo wall as one product, tied together by an "event" concept that propagates branding from the booth strip to the TV slideshow to the IG share. We are building it for DIY hosts who got priced out of the $550 to $1,170 photobooth rental and burned by WedPics shutting down (per `docs/research/users.md` and `docs/research/competitors.md`). We win by being free where it should be free (taking photos at home), reasonable per event where the host has real budget, and the only product that makes the booth and the wall feel like one thing. The wedge is bundling: nobody else combines a photobooth app with a guest-upload wall under one event, and that lets every photo TinyBooth touches double as marketing for the next host.

## 2. Product decisions (the calls)

Every meaningful decision, with the alternative we passed on and a one-sentence why.

- **Cross-platform mobile framework: Expo (React Native) with the New Architecture.** Alternative: Flutter. Picked Expo because the rest of the stack is TypeScript and we get a shared monorepo with Next.js (per `docs/research/tech-stack.md`).
- **Camera library: `react-native-vision-camera`.** Alternative: `expo-camera`. Vision-camera talks directly to AVFoundation/CameraX with no JS-bridge frame copies, which matters for a capture app where the photo is the product.
- **Photostrip composition: client-side via `react-native-skia`.** Alternative: server-side Sharp render. Skia keeps the print path working when venue WiFi dies; we add a server fallback for the IG share render.
- **Print: `expo-print`.** Alternative: a custom native module. `expo-print` wraps `UIPrintInteractionController` (the exact API the Swift app already uses) and Android Print Framework. Verify 2x6 paper size on a real Selphy in Phase 2.
- **Backend: keep one Next.js app on Vercel Pro.** Alternative: split into a separate Hono service on AWS Lambda. Vercel stays cheap until ~$500/mo of bills and the existing TinyWall is already a Next.js app; revisit when it actually hurts.
- **Database: Supabase Postgres.** Alternative: keep Neon (the silent home of the old "Vercel Postgres"). Supabase bundles Auth + Realtime + Storage in the same bill, which we need anyway, and Row-Level Security solves multi-tenant event ownership in SQL instead of in middleware (per `docs/research/tech-stack.md`).
- **Object storage: Cloudflare R2.** Alternative: Supabase Storage or AWS S3. R2's $0/GB egress is the right answer for a free-tier product where every guest pulls thumbnails dozens of times per event. Storage layer abstracted behind one interface so we can swap in <100 LOC if R2 becomes painful.
- **Auth provider: Supabase Auth.** Alternative: Clerk. Supabase is bundled with the DB and ~6x cheaper than Clerk at scale. Apple Sign-In + Google + email magic link, no passwords (per Apple's 4.8 rule and `docs/research/monetization.md`).
- **Realtime: Supabase Realtime (Postgres CDC channels).** Alternative: stay on the current 3-second polling, or move to Pusher/Ably. Supabase Realtime is already paid for and scales to thousands of TVs on the free tier (per `docs/research/tech-stack.md`).
- **API surface: tRPC for client-to-server, plus a thin REST shim for upload endpoints.** Alternative: keep Apollo GraphQL. Apollo is overkill for a solo dev with no third-party API consumers; tRPC gives us end-to-end TS types with no codegen step and no Apollo Server in the bundle (per `docs/research/existing-tinywall.md` audit, GraphQL was a Phase-1 PoC choice). Upload endpoints stay REST because file POSTs in tRPC are awkward.
- **IAP: RevenueCat for in-app, Stripe (via RevenueCat Web Billing) for tinybooth.com.** Alternative: raw StoreKit 2 + Play Billing + Stripe direct. RevenueCat is free under $2.5K MTR and saves ~80 hours of receipt validation work per `docs/research/monetization.md`.
- **Monorepo: Turborepo + pnpm workspaces.** Alternative: Nx, polyrepo. Turbo is Vercel-native, has a free remote cache, and is the right size for 3 apps + a few packages.
- **Pricing tiers and prices:**
  - **Free:** TinyBooth standalone, all layouts, all messages, AirPrint, Camera Roll save, IG share with TinyBooth wordmark in the footer. Free TinyWall room: 100 uploads, 7-day retention, live wall included, no custom branding.
  - **Strip Unlock $1.99 (consumable IAP only):** Removes the watermark from a single most-recent photostrip. Safety valve for users who want one clean strip without buying a full event.
  - **Event Pass $14.99 IAP / $12.99 web (consumable):** One event, 24 hours of active uploads, 150 TinyWall guest uploads, custom branding (logo + colors) on strips and wall, watermark removed for that event, web dashboard, 60-day retention, bulk export, 50 email/SMS deliveries.
  - **Event Pass Plus $39 IAP / $34 web (consumable):** Same plus unlimited guests, 90-day retention, 250 email/SMS deliveries, custom message library (host adds up to 50 messages to the random pool), priority IG-share render.
  - **Pro Host $9.99/mo or $79/yr:** Skip at launch. Ship in year 2 once we have repeat-host data.
  - Alternative considered: lifetime unlock. Rejected because paid features have real per-event costs (storage, SMS) and we'd be on the hook forever.
- **Watermark approach:** Small "tinybooth.com" wordmark in the bottom-right corner of the photostrip and bottom of the IG-format share. Same wordmark, two assets (one for print resolution, one for square IG). Removed by Event Pass for that event's strips, or by the $1.99 Strip Unlock for the most recent strip in standalone mode. The IG-format wordmark stays on free shares; this is the brand-distribution lever and we don't let paid hosts strip it from the IG version (decide differently only if that one feature is the thing converting Pro hosts).
- **Free tier limits:**
  - TinyBooth standalone: unlimited photos, all layouts, all messages, on-device only, no cloud.
  - Free TinyWall event: 100 uploads, 7-day retention, live wall included, no custom branding, no email/SMS delivery, no bulk export. This beats Kululu (50 uploads, 7 days) and crushes LiveShareNow (10 newest posts) per `docs/research/competitors.md`.
  - Image processing on free: resize to 2048px wide WebP, JPEG-only on upload, no video on free TinyWall (video is paid only).
- **Dashboard URL: `tinybooth.com/dashboard`.** Alternative: `dashboard.tinybooth.com` or `events.tinybooth.com`. Subdirectory consolidates link equity to the root domain (per `docs/research/seo.md`). Behind auth, marked noindex.
- **Migrate `wall.tinybooth.com` to `tinybooth.com/wall`.** Alternative: keep the subdomain. Migrate it. The current subdomain is a one-event PoC with essentially no organic backlinks to lose, and subdirectories pass equity to the root domain (per `docs/research/seo.md`). 301 the whole subdomain.
- **Bundle ID: keep `com.codesquad.tinybooth`** so existing iOS users get the new app as an update, not a new install (per `docs/research/existing-tinybooth.md`). Set in `app.json` as `ios.bundleIdentifier`.
- **Existing iOS user backlash strategy:**
  - Ship the new app under the same bundle ID, exact same primary use case (open, take strip, print, save). Don't move the Print button. Don't remove the random messages. The old reviewers say "exactly what I was looking for" because it's simple; we keep it that way.
  - Free tier remains genuinely free, with the only added friction being the small wordmark on the strip. Strip Unlock at $1.99 is the goodwill release valve for users who don't want to pay for a full event.
  - Migrate the existing 9 random messages verbatim from `tinybooth-old/tinybooth/ViewController.swift:43` into `packages/messages` (per Camrynn's round-1 answer).
  - Release notes lead with what's new ("now on Android, photo wall, more layouts") and explicitly call out what didn't change ("still free, still no account, still your random messages").
  - Pocketbooth's lesson per `docs/research/competitors.md`: never delete in-app purchases users already had. We have no IAP to preserve, so this is straightforward.
- **TinyWall guests never get an app or an account.** Non-negotiable per `docs/research/users.md`.
- **No subscription at launch.** Per `docs/research/monetization.md`, photobooth hosts run 1 to 4 events a year and hate cancel-the-sub friction. Pro Host is a year-2 add.
- **Anti-steering: do NOT show external "buy on web" buttons inside the iOS app at launch.** Sell Event Passes via IAP only; let Stripe sales come from people who hit `tinybooth.com` directly. Revisit at month 6 with data.
- **Cap App Store risk: Apple Small Business Program (15%) auto-applies as new dev. Never frame the watermark unlock as anything other than IAP** to avoid the obvious 3.1.1 rejection.

## 3. Architecture

### 3.1 Monorepo layout

```
tinybooth/
├── apps/
│   ├── mobile/                   # Expo (React Native), TinyBooth app
│   ├── web/                      # Next.js: tinybooth.com marketing + dashboard + /wall product pages
│   └── wall/                     # Next.js: TV display + guest upload page (current TinyWall, refactored)
├── packages/
│   ├── api-types/                # Shared TS interfaces (Event, Post, Photo, User, Subscription)
│   ├── api-client/               # tRPC client + React Query helpers, used by mobile + web + wall
│   ├── ui-tokens/                # Brand tokens: colors, spacing, type. Consumed by RN style + Tailwind config
│   ├── messages/                 # Random message library (migrated from Swift verbatim, plus host customs)
│   ├── strip-render/             # Skia/Sharp shared layout math for photostrip composition
│   └── config/                   # eslint, tsconfig, prettier base configs
├── infra/
│   └── terraform/
│       ├── modules/              # Reusable: r2-bucket, ses-domain, twilio-secret, supabase-link
│       ├── environments/
│       │   ├── staging/
│       │   └── production/
│       └── shared/               # IAM, DNS, GH OIDC roles
├── data/
│   └── backups/                  # Already exists; existing TinyWall backups live here
├── docs/
└── scripts/                      # one-off tools: migrate-tinywall, seed-messages
```

Note on `apps/web` vs `apps/wall`: keep them as separate Next.js apps because the wall has a long-lived TV display that needs different middleware (no auth wall, looser CSP for embedded media) than the marketing/dashboard app. They share the tRPC server via `packages/api-client` so the data layer stays unified. Both deploy to the same Vercel team but as two projects.

### 3.2 Data model (Postgres)

Carry over what works from the current TinyWall Prisma schema (Event, Post, Photo) and add the rest. Designed for Supabase Row-Level Security.

```prisma
// Users (mirrors auth.users via trigger; we read this table from app code)
model User {
  id              String    @id @default(uuid())   // matches auth.users.id
  email           String    @unique
  displayName     String?
  avatarUrl       String?
  createdAt       DateTime  @default(now())
  events          Event[]
  subscriptions   Subscription[]
  purchases       Purchase[]
}

// Events: the cross-product unit. Owned by a User (or null for free anon TinyWall rooms).
model Event {
  id              String    @id @default(cuid())
  ownerId         String?                          // null for free anon TinyWall rooms
  owner           User?     @relation(fields: [ownerId], references: [id])
  name            String
  slug            String    @unique
  tier            EventTier @default(FREE)         // FREE | EVENT_PASS | EVENT_PASS_PLUS
  startsAt        DateTime?
  endsAt          DateTime?                        // when active uploads close
  retainUntil     DateTime                         // hard delete trigger
  branding        Json      @default("{}")         // EventBranding (logo URL, colors, accent)
  settings        Json      @default("{}")         // existing EventSettings shape, evolved
  emailDeliveries Int       @default(0)
  smsDeliveries   Int       @default(0)
  createdAt       DateTime  @default(now())
  posts           Post[]
  strips          Strip[]
  customMessages  CustomMessage[]
  purchases       Purchase[]
  @@index([slug])
  @@index([ownerId, createdAt])
  @@index([retainUntil])                           // for the cleanup cron
}

// Posts: a TinyWall guest upload (1+ photos/videos in a single submission).
model Post {
  id              String    @id @default(cuid())
  eventId         String
  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  caption         String?                          // <= 100 chars, profanity-cleaned
  uploaderToken   String?                          // anon device token for "delete my own post" later
  approved        Boolean   @default(true)         // for moderation toggle
  createdAt       DateTime  @default(now())
  photos          Photo[]
  @@index([eventId, createdAt])
}

// Photos: individual files attached to a Post or a Strip.
model Photo {
  id              String    @id @default(cuid())
  postId          String?
  post            Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  stripId         String?
  strip           Strip?    @relation(fields: [stripId], references: [id], onDelete: Cascade)
  url             String                           // R2 public URL
  storageKey      String                           // R2 object key for deletion
  mediaType       String    @default("image")      // "image" | "video"
  width           Int       @default(0)
  height          Int       @default(0)
  order           Int       @default(0)
  createdAt       DateTime  @default(now())
  @@index([postId])
  @@index([stripId])
}

// Strips: a photostrip generated by TinyBooth. Optional eventId.
model Strip {
  id               String    @id @default(cuid())
  eventId          String?                         // null for standalone (no cloud upload)
  event            Event?    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  layout           String                          // "1x4_classic" | "2x2" | "1x3" | "single" | etc.
  watermarkRemoved Boolean   @default(false)
  igShareUrl       String?                         // R2 URL for the IG-format render
  createdAt        DateTime  @default(now())
  photos           Photo[]                         // 1 to 4 frames
  @@index([eventId, createdAt])
}

// Custom messages added by paying hosts to the random pool for an event.
model CustomMessage {
  id              String    @id @default(cuid())
  eventId         String
  event           Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  text            String
  createdAt       DateTime  @default(now())
  @@index([eventId])
}

// Purchase records tied to RevenueCat entitlements (consumables).
model Purchase {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  eventId         String?                          // applied to this event (for Event Pass)
  event           Event?    @relation(fields: [eventId], references: [id])
  product         String                           // "event_pass" | "event_pass_plus" | "strip_unlock"
  source          String                           // "ios_iap" | "android_iap" | "web_stripe"
  externalId      String                           // RevenueCat transaction id
  amountCents     Int
  currency        String    @default("USD")
  createdAt       DateTime  @default(now())
  @@unique([source, externalId])
  @@index([userId, createdAt])
}

// Optional Pro Host subscription (year 2; schema reserved now).
model Subscription {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  product         String                           // "pro_host_monthly" | "pro_host_annual"
  status          String                           // "active" | "grace" | "cancelled" | "expired"
  renewsAt        DateTime?
  cancelledAt     DateTime?
  source          String
  externalId      String
  createdAt       DateTime  @default(now())
}

enum EventTier {
  FREE
  EVENT_PASS
  EVENT_PASS_PLUS
}
```

Carried over from current TinyWall:
- `Event`, `Post`, `Photo` exact shape preserved so the migration script is dumb-simple (renames `Event.dateCreated` to `Event.createdAt`, adds `ownerId`/`tier`/`retainUntil`/`branding`).
- `Event.settings` JSON kept for backward compat; new `branding` JSON is split out so SQL queries against branding don't fight with feature flags.

Evolved:
- `Photo.storageKey` added so cleanup jobs can delete from R2 without parsing URLs.
- `Strip` added (didn't exist, since TinyWall has no booth).
- `Purchase`/`Subscription` added.

Row-level security: `events` has policies "owner can do anything where `ownerId = auth.uid()`" and "anyone can read where `slug = $1`" (for the public TinyWall view). Posts/photos cascade via the event policy. Anon guests use a service-role server route for inserts (we don't expose insert directly to anon clients).

Free anon TinyWall rooms are events with `ownerId = null`. They get the FREE tier defaults and the cleanup cron deletes them at `retainUntil`. If a host claims a free room later (logs in and runs "this is mine"), we set `ownerId` server-side via a one-time claim token issued at creation time.

### 3.3 API surface

**tRPC** (mounted at `/api/trpc/[trpc]` on `apps/web`, called from mobile, web, and wall):

- `event.create({ name, settings? })` — both anon and authed.
- `event.bySlug({ slug })` — public, gated by RLS.
- `event.update({ id, name?, branding?, settings? })` — auth, owner-only.
- `event.applyPurchase({ eventId, purchaseId })` — server validates RevenueCat entitlement, sets tier + extends retention.
- `event.delete({ id })` — auth, owner only, cascades.
- `post.create({ eventId, caption?, photos: PhotoInput[] })` — public for now; gated by event tier limits + per-IP rate limit.
- `post.list({ eventId, since?, limit? })` — public, returns published posts for the slideshow.
- `strip.create({ eventId?, layout, photos: PhotoInput[] })` — auth or anon device token; renders the IG share server-side.
- `dashboard.events()` — auth, returns owner's events.
- `dashboard.eventPhotos({ eventId })` — auth, owner only.
- `dashboard.exportEvent({ eventId })` — auth, owner only, returns signed R2 zip URL.
- `messages.list({ eventId? })` — returns the static library merged with the event's custom additions.
- `purchase.recordWebhook(...)` — internal, called from RevenueCat webhook only.

**REST** (`/api/upload`, `/api/upload/token`, `/api/webhooks/revenuecat`, `/api/cron/cleanup`):

- `POST /api/upload` — multipart, max 10 files, image-only here. Sharp processes (rotate, resize 2048px, WebP), uploads to R2.
- `POST /api/upload/token` — returns pre-signed R2 multipart upload URL for video (paid only).
- `POST /api/webhooks/revenuecat` — verifies signature, upserts Purchase, calls `event.applyPurchase` server-side.
- `POST /api/cron/cleanup` — Vercel Cron at `0 * * * *`, deletes posts/photos/strips where `event.retainUntil < now()`, deletes R2 objects via storage key.

Why we picked tRPC over keeping Apollo: the current GraphQL surface has 4 queries and 7 mutations, all consumed by the same Next.js app. Apollo Server is 30MB of bundle to deliver no value over tRPC's 100KB. Migration is straightforward because the schema is small.

### 3.4 Realtime channels

Supabase Realtime subscriptions, scoped by event:
- `posts:event_id=eq.{eventId}` — TV display subscribes; client gets `INSERT`/`UPDATE` on the Posts table for that event.
- `photos:post_id=in.({postIds})` — TV display subscribes for slideshow updates within multi-photo posts.
- `events:id=eq.{eventId}` — dashboard subscribes for live counter updates (uploads received, deliveries used).

Replaces the current 3-second polling (per `docs/research/existing-tinywall.md`). One reconnect + backoff hook in `packages/api-client` covers both web and mobile clients (mobile uses Supabase JS client, no React Native specific code needed beyond a polyfill for `WebSocket`).

### 3.5 Storage paths and lifecycle policies

R2 bucket: `tinybooth-events`. Path structure:

```
events/{eventId}/posts/{postId}/{photoId}.webp
events/{eventId}/strips/{stripId}/frame-{order}.webp
events/{eventId}/strips/{stripId}/composed.webp        # the rendered strip
events/{eventId}/strips/{stripId}/ig-share.webp        # the square IG version
events/{eventId}/exports/{exportId}.zip                # bulk download zips, 24hr signed
```

Lifecycle rules (Vercel Cron, since R2 doesn't have native lifecycle policies on the free tier):
- Free tier (`event.tier = FREE`): `retainUntil = createdAt + 7 days`. Cron deletes.
- Event Pass: `retainUntil = endsAt + 60 days`. Cron deletes.
- Event Pass Plus: `retainUntil = endsAt + 90 days`. Cron deletes.
- Standalone strips (no eventId): never uploaded to cloud. Stay on device.
- Export zips: signed URL expires after 24 hours, file deleted by cron after 48 hours.

Image processing: Sharp (already a TinyWall dep) auto-rotates EXIF, resizes max 2048px wide, converts to WebP at 80% quality. JPEG fallback for older browsers (we send WebP only; the upload pipeline is ours).

### 3.6 Auth flows

Four distinct flows. All routed through Supabase Auth.

1. **App standalone (no auth):** Open TinyBooth, take photos, save to Camera Roll, optionally print. No network calls. No sign-in. Photos never leave the device.
2. **App + event host (auth required):** Host taps "Connect to event" or "Create event," app routes to Supabase Auth flow with Apple Sign-In (default), Google, or email magic link. JWT stored in Expo SecureStore. The app then talks to the event tRPC endpoints with the JWT in headers; RLS enforces ownership.
3. **Web dashboard (auth required):** Same Supabase Auth flow on `tinybooth.com/dashboard`. Cookies via `@supabase/ssr` so SSR pages render with the user context.
4. **TinyWall guest (no auth ever):** Guest scans QR, lands on `tinybooth.com/wall/{slug}/upload`, no welcome screen for repeat visitors (cookie). Posts go through a service-role server route so anon clients never touch the DB directly. Per-IP rate limit (10 posts/minute). Optional anon device token in localStorage so a future "delete my upload" feature can verify ownership.

### 3.7 Print pipeline

iOS: `expo-print` → `Print.printAsync({ uri })` where `uri` is a local file:// path to the composed PNG. This wraps `UIPrintInteractionController`, the same API the Swift app uses (`ViewController.swift:321-342` per `docs/research/existing-tinybooth.md`).

Android: `expo-print` wraps Android's Print Framework. Output is a PDF; system print UI handles printer selection. Test path: Canon Selphy via Wi-Fi Direct (Selphy supports IPP everywhere). Fallback: `expo-sharing` to "Print" intent if `expo-print` doesn't surface the right printer on a specific Android version.

Selphy queue stall fix (per `docs/research/users.md`): wrap the print call in a 12-second timeout. If the print sheet doesn't return success, surface "Print queue may be stuck. Tap to restart printing." which calls `Print.printAsync` again. Track stall events in PostHog so we can tune the timeout. The Wifibooth forum thread says the queue stalls after 8 to 10 prints; a sentinel in `mobile/src/lib/printQueue.ts` automatically restarts the iOS print subsystem (small native module via `Print.selectPrinterAsync` cycle) every 8 prints.

## 4. Phased build plan

Six phases. Each gets its own goal, deliverables, definition of done, and rough effort. Effort is calendar weeks of one solo dev working evenings/weekends, not full-time-engineer-weeks.

### Phase 0 — Foundations (1 week)

**Goal:** Empty monorepo that builds, lints, types, tests on green CI.

**Scope:**
- Init Turborepo + pnpm workspaces.
- Stub out `apps/mobile`, `apps/web`, `apps/wall`. Mobile is `npx create-expo-app` with TypeScript template; web/wall are `create-next-app` (App Router, TS).
- Create `packages/api-types`, `packages/ui-tokens`, `packages/messages` (with the 9 messages migrated from `tinybooth-old/tinybooth/ViewController.swift:43`), `packages/config`.
- Wire shared eslint, tsconfig, prettier configs from `packages/config`.
- GitHub Actions: `ci.yml` runs `turbo run lint typecheck test` on every PR.
- Vercel projects created (web + wall), no domains attached yet.
- Supabase project created (free tier).
- R2 bucket created (`tinybooth-events` + `tinybooth-events-staging`).
- `infra/terraform/` skeleton mirroring `bookish/bookish-infra/`: empty `modules/`, `environments/staging`, `environments/production`, no resources defined yet.
- Brand tokens v0 in `packages/ui-tokens` (placeholder values; designer pass in Phase 2).

**Definition of done:**
- `pnpm install && pnpm turbo run lint typecheck test build` exits 0 from the repo root.
- A no-op PR runs the CI workflow and passes in under 3 minutes (cache hit on second run).
- Mobile app boots in Expo Go showing a "TinyBooth" placeholder screen.
- Web and wall apps each render a placeholder homepage.

**Risks:** None. This is plumbing.

**Effort:** 1 week.

### Phase 1 — TinyWall v2 (3 weeks)

**Goal:** Modernized TinyWall on `tinybooth.com/wall`, multi-event with per-event retention, no-account guest upload, real-time via Supabase, existing 71 photos migrated, paywall-ready but no paywall yet.

**Scope:**
- Migrate Postgres schema from current Prisma to the new schema in section 3.2. Use `data/backups/tinywall-prod-20260426-015624-*.csv` to seed Supabase (script in `scripts/migrate-tinywall.ts`). Re-upload existing photos from old Vercel Blob URLs to R2.
- Rebuild guest upload page at `apps/wall/app/[slug]/upload/page.tsx`, preserving the current state machine (welcome → capture → preview → upload) but replacing Apollo with tRPC.
- Rebuild TV display at `apps/wall/app/[slug]/page.tsx` with Supabase Realtime instead of polling. Keep the carousel logic, the QR overlay, the slideshow speed setting.
- New per-event retention: `retainUntil` set on event create. Cron job in `apps/web/app/api/cron/cleanup/route.ts` runs hourly.
- New event creation form on `tinybooth.com/wall` (subdir, not subdomain). For now, anon creation with optional "claim this event later" link emailed to the creator's email.
- Set up 301 redirects from `wall.tinybooth.com/*` to `tinybooth.com/wall/*`. Vercel.json on the old project, kept alive for 12 months.
- Per-IP rate limiting on `/api/upload` via Upstash Redis (free tier).
- Profanity filter (keep `bad-words` lib, currently used).
- Image processing via Sharp (keep the WebP + 2048px logic).
- Wire RevenueCat SDK on web only (Stripe-backed via RevenueCat Web Billing). Don't add the paywall UI yet; just verify webhook + entitlement flow works against test purchases.

**Definition of done:**
- `tinybooth.com/wall` renders the create-event form. Creating an event works end-to-end.
- Guest at a real event can scan QR, upload a photo, see it appear on the TV display in <2s (Realtime).
- All 4 existing events + 48 posts + 71 photos visible at their original slugs.
- Cron job deletes a test event with `retainUntil` in the past.
- 301 from `wall.tinybooth.com/{slug}` to `tinybooth.com/wall/{slug}` returns the right page.
- One Stripe test purchase routes through RevenueCat webhook and inserts a Purchase row.

**Dependencies:** Phase 0.

**Risks:**
- Vercel Blob → R2 photo migration is one-shot; if a URL is missing, the photo is gone. Pre-flight: HEAD every URL in the Photo table, log misses, decide on a per-row basis.
- Supabase free tier pauses after 7 days of inactivity. Move to Pro ($25/mo) as soon as a real user is in the system. Per `docs/research/tech-stack.md`.

**Effort:** 3 weeks.

### Phase 2 — TinyBooth standalone (4 weeks)

**Goal:** Cross-platform TinyBooth app with feature parity to the Swift original, plus multiple layouts, watermark, AirPrint working on real Selphy hardware, IG-format share, random messages library.

**Scope:**
- Camera screen using `react-native-vision-camera`. Front-facing default. 3-second countdown. 4-shot sequence. Random message overlay between shots (using `packages/messages`).
- Layouts: `1x4_classic`, `2x2`, `1x3`, `single`, `1x6_double` (the existing Swift output is 1x4 in two columns; preserve that as the default). Layout picker in a bottom sheet, persists per session.
- Photostrip composition via `react-native-skia`. Output 800x1200 (matches existing Swift output per `PhotoUtil.swift:17-18`).
- Watermark renderer: tiny `tinybooth.com` wordmark in the bottom-right of the strip and bottom of the IG version. Removable by entitlement.
- Preview screen with Print, Share, Redo, "Save to Camera Roll" buttons.
- AirPrint via `expo-print` on iOS; Android Print Framework via `expo-print`.
- Share sheet via `expo-sharing`.
- IG-format render: 1080x1920 vertical with the four photos arranged 2x2 in the upper third, branded background, TinyBooth wordmark at the bottom. Render server-side in `apps/web/app/api/share/[stripId]/route.ts` (Sharp, since we want the same render whether mobile or web requests it). Returns an R2 URL.
- Settings screen: flash on/off, layout default, tablet/phone preview toggle.
- Tablet-first layout: portrait iPad as default, landscape works, phone secondary. Use `useWindowDimensions()` plus a 768 breakpoint.
- Guided Access guidance: in-app help shows "How to set up for an event" with Guided Access setup instructions per `docs/research/users.md`.
- Selphy queue stall handling per section 3.7.
- Strip Unlock IAP wiring via RevenueCat (the $1.99 consumable).

**Definition of done:**
- Build runs on iPad Pro 12.9 (real device), iPhone 15, a Pixel tablet, a Pixel 8.
- Take 4 photos, see strip, print to a real Canon Selphy CP1500. Test 12 prints in a row to verify the queue stall handling.
- Share via iOS share sheet to Photos + Messages.
- Watermark visible on free strip; gone after Strip Unlock IAP test purchase.
- Random message displays between every shot.
- All 9 original messages plus any additions render correctly.
- `eas build --profile preview --platform all` produces install-able binaries.

**Dependencies:** Phase 0. Independent of Phase 1.

**Risks:**
- Vision-camera + Skia perf on a $200 Android tablet is the unknown. Bench at start of Phase 2; fall back to server-side composition if mobile compositing chugs (per `docs/research/tech-stack.md`).
- AirPrint paper sizes for 2x6 photostrips: `expo-print` exposes Apple's standard paper picker, but custom photostrip paper may not appear. If not, drop to a 4x6 single (which the standard photo printer slot accepts) and document the workaround.

**Effort:** 4 weeks.

### Phase 3 — Events as the cross-product unit (2 weeks)

**Goal:** Auth, dashboard, branding propagation. An event created in TinyBooth shows up on TinyWall and vice versa.

**Scope:**
- Supabase Auth: Apple Sign-In + Google + email magic link in mobile and web.
- Dashboard at `tinybooth.com/dashboard`: list of events, per-event detail view with photos + strips + bulk download.
- Event creation flow: create from mobile, create from web. Event ID + slug are the cross-product join key.
- Branding propagation: when host edits branding in dashboard, the next strip rendered from the booth uses the new logo + colors. TinyWall TV display refreshes via Realtime when branding changes.
- Mobile "Connect to event" flow: enter event slug or scan a host-only QR from the dashboard; subsequent strips upload to the event's R2 path.
- Web `/wall/[slug]` shows event branding (header logo, theme colors) when set.
- Bulk export endpoint: builds a zip of all photos for an event, signed R2 URL, sent to host via email (SES) when ready.
- Account deletion in mobile + web (required by Apple, per `docs/research/monetization.md`).

**Definition of done:**
- Sign in with Apple on iPad, create event, get event slug.
- Open `tinybooth.com/wall/{slug}` on a Smart TV browser, see the branded TV display.
- Take a strip in TinyBooth tied to that event; strip appears in the dashboard within 5s.
- Guest scans QR on phone, uploads, appears on TV in <2s alongside booth strips.
- Bulk export downloads a zip with all event media.
- Account delete removes user + all owned events + all event media within 30 days (cron).

**Dependencies:** Phase 1, Phase 2.

**Risks:**
- Supabase RLS policies that are wrong can leak data. Mitigation: 100% write tests on policies via `pgTAP` suite running in CI against a Supabase test project.
- Cross-product event sync timing: dashboard might lag behind real-time uploads if clients aren't subscribed. Use Realtime channels everywhere, not polling.

**Effort:** 2 weeks.

### Phase 4 — Monetization (2 weeks)

**Goal:** Event Pass and Event Pass Plus purchasable on iOS, Android, and web. Paywall UI built with RevenueCat. Entitlements gate features correctly.

**Scope:**
- App Store Connect: create products (`event_pass`, `event_pass_plus`, `strip_unlock` consumables). Configure Small Business Program enrollment.
- Google Play Console: same product set.
- RevenueCat: create entitlements (`event_pass`, `event_pass_plus`), wire products to entitlements, set up the webhook to `apps/web/app/api/webhooks/revenuecat/route.ts`.
- Stripe: create products on web for Event Pass ($12.99) and Event Pass Plus ($34). Wire to RevenueCat Web Billing.
- Paywall UI: simple modal in mobile and web. Headline, three feature bullets per tier, clear CTA. RevenueCat's paywall builder is fine.
- `event.applyPurchase` server logic: on Purchase insert, set `event.tier`, extend `retainUntil`, raise the upload cap.
- Email/SMS delivery: SES + Twilio integrations. Quotas tracked per event in `Event.emailDeliveries` and `Event.smsDeliveries`.
- Privacy labels filed in App Store Connect and Play Console.
- Fastlane lanes for iOS metadata sync (so we can update the App Store listing from CLI).

**Definition of done:**
- Sandbox purchase of Event Pass on iOS upgrades a test event from FREE to EVENT_PASS, removes watermark from the next strip taken for that event, raises TinyWall guest cap to 150.
- Same flow works on a Play test track.
- Web Stripe checkout creates an Event Pass and links it to an event.
- Apple sandbox refund test correctly downgrades the event.

**Dependencies:** Phase 3.

**Risks:**
- App Store review rejecting the watermark unlock framing: mitigate by writing review notes that explicitly describe IAP as the unlock mechanism, no external license keys.
- RevenueCat webhook missing a purchase: idempotent insert via `Purchase.unique([source, externalId])` handles retries.

**Effort:** 2 weeks.

### Phase 5 — Marketing site + SEO content (2 weeks parallel + ongoing)

**Goal:** `tinybooth.com` is live with the cornerstone landing pages, structured data, sitemap, blog, and the first 8 posts. Search Console + Bing Webmaster verified.

**Scope:**
- Landing pages per the SEO research (per `docs/research/seo.md`):
  - `/` (brand pitch + both products)
  - `/app`, `/app/ipad`, `/app/iphone`, `/app/android`
  - `/app/for-weddings`, `/app/for-birthdays`, `/app/for-corporate-events`
  - `/wall`, `/wall/for-weddings`, `/wall/live-slideshow`
  - `/events` (cross-product story)
  - `/pricing`
  - `/blog`, `/blog/[slug]`
  - `/help`, `/about`, `/contact`, `/legal/privacy`, `/legal/terms`
- First 8 blog posts from the SEO content list, prioritizing the wedding-hashtag-is-dead post.
- Schema: `SoftwareApplication`, `Organization`, `BreadcrumbList`, `Article`, `Product` per `docs/research/seo.md`.
- `sitemap.ts` and `robots.ts` via Next.js conventions.
- Core Web Vitals targets met: LCP <2.5s, INP <200ms, CLS <0.1.
- Search Console + Bing Webmaster Tools set up, sitemap submitted.

**Definition of done:**
- All cornerstone pages live and indexed (visible in `site:tinybooth.com` after a week).
- PageSpeed Insights mobile scores 90+ on every cornerstone page.
- 8 blog posts published, each 1,500-2,500 words with original screenshots and proper internal linking.

**Dependencies:** Phase 1 (because `/wall` exists), but most of this work can be done in parallel with Phase 2 and Phase 3.

**Risks:** None technical. Risk is content quality if rushed.

**Effort:** 2 weeks of focused effort, then ongoing 2 posts/month per the SEO plan.

### Phase 6 — App Store + Play Store submission (2 weeks)

**Goal:** Apps approved on TestFlight and Play Internal track, then promoted to public.

**Scope:**
- ASO copy per `docs/research/seo.md` section 5: title `TinyBooth: Photo Booth App` (26 chars), subtitle `Free iPad Booth for Parties` (27 chars), 100-char keywords field, 4000-char description.
- Screenshots: 6 hero screenshots in iPad and iPhone sizes, captioned with keyword-rich descriptions per the ASO research.
- Preview video (30s) showing booth → strip → print → wall.
- Privacy labels and App Privacy questionnaire completed accurately.
- Apple Sign-In implemented (required since we offer Google Sign-In).
- Account deletion in-app verified (required since June 2022).
- TestFlight invite list (Camrynn + 5 friends) for week 1.
- Play Console: same materials adapted, 80-char title, full description.
- Both apps submitted via `eas submit --platform all --profile production`.

**Definition of done:**
- Public release of TinyBooth on the App Store and Play Store under bundle ID `com.codesquad.tinybooth` (existing iOS users get the update prompt).
- App Store reviews of the previous version preserved (Apple does this automatically on update under same bundle ID).
- First post-release crash report from Sentry triaged within 24h.

**Dependencies:** Phases 2, 3, 4.

**Risks:**
- Apple review rejection: most likely cause is privacy label inaccuracy or unclear IAP description. Pre-flight by reading the latest review notes for similar apps and writing precise reviewer notes.
- Existing iOS users seeing the new app and being confused: in-app changelog modal on first launch of the new version explains what changed and explicitly says "still free, still no account required, your random messages are still here."

**Effort:** 2 weeks.

## 5. Migration plan for existing users

### 5.1 iOS App Store update (existing TinyBooth users)

We ship the new Expo app under the same bundle ID (`com.codesquad.tinybooth`) and the same App Store listing. Users who have the current Swift app installed will see a normal "Update Available" prompt.

What gets preserved:
- The core workflow: open app → tap to start → 3 second countdown → 4 photos → preview → print or share. Same flow, same buttons in the same places.
- The 9 random messages: migrated verbatim from `tinybooth-old/tinybooth/ViewController.swift:43` into `packages/messages/src/library.ts`.
- AirPrint via the iOS print sheet, same paper picker users already know.
- Free, no account, no watermark by default in standalone mode. The watermark is only added if we ship it in the new version; given the goodwill risk, ship a "no watermark on standalone strips for the first 6 months" grandfather flag and surface a one-time "support TinyBooth" $1.99 IAP modal once per user instead. After 6 months we evaluate whether to enable the standalone watermark; we never enable it for users who already have at least one Strip Unlock or Event Pass purchased.
- Help screen: keep the GitHub link working (per the old `HelpViewController.swift` content). Add a real "How to set up at an event" section.

What changes (and is messaged in the changelog):
- Now on Android (same brand, same vibe).
- More layouts: 2x2, 1x3, single, plus the original 1x4.
- New: connect the booth to a TinyWall photo wall for an event.
- New: optional event branding for paying hosts.
- New: IG-format share so people can post the strip to Stories.
- The 9 messages you know are still here. Custom messages are paid.

What we don't do:
- Don't introduce a subscription on day one. Pocketbooth's subscription pivot is the cautionary tale (per `docs/research/competitors.md`). Pure consumable pricing only at launch.
- Don't gate the print button. Existing free users can print forever.
- Don't make existing users sign in to use the standalone app. Ever.

### 5.2 TinyWall data migration

Existing data: 4 events, 48 posts, 71 photos. Already exported to `data/backups/tinywall-prod-20260426-015624-*.csv` plus a schema.sql.

Steps (`scripts/migrate-tinywall.ts`):

1. Provision Supabase project (staging first), apply the new Prisma schema.
2. Read `Event.csv`, transform: `dateCreated` → `createdAt`, set `tier = FREE`, set `retainUntil = createdAt + 365 days` (existing events are grandfathered to a year, not 7 days, since they were free under the old terms). Insert.
3. Read `Post.csv`, transform: same column rename, `eventId` carries over. Insert.
4. Read `Photo.csv`. For each row:
   - HEAD-request the existing Vercel Blob URL.
   - On 200, stream the blob into R2 at `events/{eventId}/posts/{postId}/{photoId}.webp`.
   - Update `url` to the new R2 URL, set `storageKey`.
   - On miss, log to `data/migration-misses.csv` and skip.
5. Run a verification pass: count rows in each table, sample 10 photos, confirm they load via the new R2 URLs.
6. After Phase 1 ships, repoint `tinybooth.com/wall/{slug}` to read from Supabase. Old `wall.tinybooth.com` stays alive for 12 months as a redirect-only deploy.
7. Schedule the old Vercel Postgres for shutdown 90 days after migration ships. Final backup before shutdown.

The old admin password (per `docs/research/existing-tinywall.md`) is dropped. The new admin surface is the dashboard, gated by Supabase Auth.

## 6. Infra plan

### 6.1 What's hosted where

| Layer | Service | Why |
|---|---|---|
| Marketing + dashboard + APIs (`apps/web`) | Vercel Pro | Next.js native, free remote cache for Turbo, PR previews automatic. |
| TV display + guest upload (`apps/wall`) | Vercel Pro | Same reasons; separate project for middleware isolation. |
| Database + Auth + Realtime | Supabase Pro ($25/mo as soon as a real user signs up) | One vendor for three things we need. RLS for multi-tenant. |
| Object storage | Cloudflare R2 | Zero egress fees. S3-compatible. Free tier covers small launch. |
| Email delivery | AWS SES | $0.10 per 1000 sends, far cheaper than alternatives at our scale. |
| SMS delivery | Twilio | $0.0083/msg. Industry standard, well-documented. |
| Mobile builds | EAS (Expo) | Wraps Fastlane; manages certs and provisioning. |
| Crash + perf monitoring | Sentry (free tier) | Mobile + web in one dashboard. |
| Analytics | PostHog (free self-host or cloud free tier) | Product analytics, A/B tests for paywall, session replay. |
| IAP infra | RevenueCat (free under $2.5K MTR) | Single SDK across iOS/Android/web. |
| Web payments | Stripe | Standard, integrates cleanly with RevenueCat Web Billing. |
| Domain | Migrate `tinybooth.com` from GoDaddy to Cloudflare DNS | Cheaper renewals, faster DNS, better DDoS protection, free SSL. |

### 6.2 AWS Terraform structure (mirror `bookish/bookish-infra/`)

```
infra/terraform/
├── modules/
│   ├── ses-domain/              # SES domain identity, DKIM, MAIL FROM
│   ├── github-oidc/             # OIDC role for GitHub Actions to deploy infra
│   └── twilio-secret/           # Secrets Manager wrapper for Twilio creds
├── environments/
│   ├── staging/
│   │   ├── main.tf              # provider config, backend (S3 + DynamoDB lock)
│   │   ├── ses.tf
│   │   ├── secrets.tf
│   │   └── terraform.tfvars
│   └── production/
│       └── (same files, prod values)
└── shared/
    ├── iam-base.tf              # baseline IAM, billing alarms
    └── github-oidc.tf
```

AWS scope is minimal: SES (email), Secrets Manager (Twilio creds + R2 keys), an S3 bucket for Terraform state and Vercel build artifacts overflow. No Lambda, no API Gateway, no RDS at launch. Everything else is on Vercel/Supabase/Cloudflare/managed SaaS.

### 6.3 Cost estimate

**Free tier baseline (no paying users):**
- Vercel Pro: $20/mo (required since we're commercial; Hobby is non-commercial per `docs/research/tech-stack.md`).
- Supabase Pro: $25/mo (avoid the 7-day inactivity pause).
- Cloudflare R2: $0 (under 10GB storage and 10M Class B ops on free tier).
- AWS SES: ~$0 (free tier covers first 62,000 sends/mo from EC2, $0.10/1k otherwise).
- Twilio: $0 baseline, pay per message.
- RevenueCat: $0 under $2.5K MTR.
- Sentry, PostHog: $0 on free tiers.
- Domain renewal: ~$15/year amortized.
- **Baseline: ~$45/mo.**

**At first 100 paid users (assume 100 Event Pass purchases per month, mix of $14.99 IAP and $12.99 web):**
- Revenue: ~$1,400/mo gross. After 15% Apple/Google blended fee on the IAP half ($700 × 0.15 = $105) and 2.9% + $0.30 Stripe on the web half ($700 × 0.029 + $30 = $50.30): net ~$1,245.
- Cloud cost per Event Pass: ~$1.90 (per `docs/research/monetization.md`). 100 events × $1.90 = $190.
- Vercel: $20.
- Supabase: $25.
- Twilio: 100 × 50 × $0.0083 = $42.
- SES: 100 × 50 × $0.0001 = $0.50.
- RevenueCat: still free (under $2.5K MTR).
- **Total infra + COGS: ~$278/mo. Net ~$967/mo at 100 paid users.** Margin ~70%.

This matches the unit economics in `docs/research/monetization.md`. The plan stays profitable at every step.

## 7. CI/CD

### GitHub Actions workflows

`.github/workflows/`:

- **`ci.yml`** (push, PR): pnpm install with cache, `turbo run lint typecheck test build` across the monorepo. Turbo remote cache via Vercel free tier. Runs in <3 min on cache hit.
- **`web-deploy.yml`**: Vercel handles auto-deploy from `main` and PR branches; this workflow exists only to gate deployment on `ci.yml` passing (via `needs:`).
- **`mobile-build.yml`** (manual dispatch + tag push `mobile-v*`): runs `eas build --platform all --profile production`, then `eas submit --platform all` to TestFlight + Play Internal track.
- **`eas-update.yml`** (push to `main`, paths in `apps/mobile/**`): runs `eas update --branch production` to ship JS-only changes OTA without an App Store review. Limited to UI/copy/logic changes; native changes still need a `mobile-build.yml` run.
- **`infra-plan.yml`** (PR touching `infra/**`): runs `terraform plan` for staging and production, comments the diff on the PR.
- **`infra-apply.yml`** (manual dispatch only): runs `terraform apply`. Never auto-applied. Always reviewed.
- **`migration.yml`** (manual dispatch): runs the TinyWall data migration script, with `--dry-run` flag enforced unless `confirm: true` input is provided.

### EAS Build profiles

`eas.json`:

- `development` — dev client, internal distribution, with all dev tools.
- `preview` — internal distribution, ad hoc / TestFlight internal, used for QA per release branch.
- `production` — store submission, release configuration.

### Preview environments per PR

- Web + wall: Vercel auto-creates a preview deployment per PR with a unique URL like `tinybooth-pr-42.vercel.app`.
- Mobile: skip per-PR preview builds (EAS credits aren't infinite). Per release branch, `eas build --profile preview` produces an internal-distribution build linked from the PR description.
- Infra: `terraform plan` output posted as a PR comment; no apply without manual dispatch.

## 8. Open questions for Camrynn

Real questions only, in priority order.

1. **Pricing validation.** I'm picking $14.99 for Event Pass and $39 for Event Pass Plus per `docs/research/monetization.md`. Are you good with these as launch prices? POV is at $4.99 (tiny events) and Lense is at $34.99; we're sitting in between at the wedding-grade end. We can adjust during App Store Connect setup before submission, not after.
2. **Apple developer account ownership.** The current TinyBooth listing is on the `codesquad` developer account (per the bundle ID `com.codesquad.tinybooth` and the help-screen GitHub link). Is that account still under your control? If not, we have an account-transfer step before Phase 6 submission. If yes, no action needed.
3. **Stripe account for TinyBooth.** You called this out in `PROMPT.md` as needing a separate Stripe account from your other projects. I won't create it; let me know when it's ready and I'll wire the keys.
4. **AWS account specifics.** For the Terraform infra, I assume we use a separate AWS account for TinyBooth (matches the `bookish` pattern). Confirm and tell me the account ID + region preference (default `us-west-2` since you're in LA).
5. **Brand refresh.** Done — see `docs/brand/identity.md`. Review the 3 logo directions and pick.
6. **Should the launch include the standalone watermark for new installs?** I'm proposing we grandfather existing iOS users to no-watermark for 6 months (goodwill move), and even for new installs default to "no standalone watermark" with a one-time "support TinyBooth" prompt. Or you could opt to add the watermark to all standalone strips from day one and rely on the $1.99 Strip Unlock as the lever. The conservative call (mine) is grandfather + no standalone watermark; the maximize-conversion call is watermark on every strip from day one. Pick one.
7. **TinyWall free tier guest cap.** I'm proposing 100 uploads (beats Kululu's 50). You okay with that number, or should we test 50 / 200 ranges first?
8. **Domain DNS migration.** I'll move `tinybooth.com` from GoDaddy to Cloudflare in Phase 5. Confirm you can hand over GoDaddy credentials when needed.

## 9. What I'm doing tonight without further input

Safe to execute right now:

- Phase 0 in full: monorepo init, package skeletons, GH Actions CI, Terraform skeleton, Vercel project shells (staging only, no prod domains attached), Supabase staging project, R2 staging bucket.
- Migrate the 9 random messages from `tinybooth-old/tinybooth/ViewController.swift:43` into `packages/messages` verbatim.
- Stub the data model in `apps/web/prisma/schema.prisma` per section 3.2 and run `prisma generate` against the staging Supabase to confirm the schema applies.
- Write `scripts/migrate-tinywall.ts` in dry-run mode that reads the CSVs from `data/backups/` and reports what would be migrated. Don't run it against production yet.
- Draft the App Store Connect ASO copy per `docs/research/seo.md` section 5 in `docs/aso.md` so it's ready to paste when the new build is submitted.
- Set up Search Console + Bing Webmaster property entries for `tinybooth.com` (verification stays pending until DNS moves).
- Draft brand tokens v0 in `packages/ui-tokens` based on the existing Swift logo colors.
- Local commits only. No push. No deploys. No spend.

Needs Camrynn's input first:

- Producing/uploading the new App Store binary (needs your decision on the watermark question + Apple Dev account status).
- Wiring Stripe keys (needs the TinyBooth Stripe account).
- Pointing `tinybooth.com` DNS at Vercel (needs GoDaddy access + your green light).
- Applying Terraform to a real AWS account (needs the account ID).
- Migrating the actual TinyWall production data to Supabase (needs your green light to flip the redirect from `wall.tinybooth.com`).
- Pricing the Event Pass and Event Pass Plus tiers in App Store Connect (needs your sign-off on numbers).
