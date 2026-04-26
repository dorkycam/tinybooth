# TinyBooth + TinyWall Tech Stack Research

This is the recommended stack for rebuilding TinyBooth (cross-platform mobile photobooth, tablet-first) and modernizing TinyWall (real-time web photo wall). Recommendations are grounded in Camrynn's actual constraints: passive-income side project, low-ops, AWS familiarity from the bookish project, Apple Developer + Google Play accounts, AWS + Vercel + Supabase already in hand, TypeScript everywhere, and the existing Next.js + Prisma + Vercel Postgres TinyWall app.

## TL;DR Recommended Stack

- **Mobile app (TinyBooth):** Expo (React Native) with the New Architecture, written in TypeScript. Single codebase ships iPad, iPhone, Android phone, Android tablet. Camera comes from `react-native-vision-camera` (not `expo-camera`) for AVFoundation/CameraX-grade quality. Print uses `expo-print` (wraps AirPrint on iOS, Android Print Framework on Android).
- **Backend / API:** Single Next.js app in a Turborepo monorepo, hosted on Vercel Pro. Mobile and TinyWall both call the same Next.js API routes. Switch to AWS only if/when Vercel costs cross ~$500/mo.
- **Database:** Supabase Postgres (replaces Vercel Postgres, which Vercel sunsetted in 2025 and silently moved to Neon). Supabase gives Postgres + Auth + Storage + Realtime in one bill, Row-Level Security for multi-tenant event data, and TypeScript types from the schema.
- **Storage:** Cloudflare R2 for event photos (zero egress fees, S3-compatible). Vercel Blob is convenient but priced like Vercel: fine until it isn't. Supabase Storage is a fine fallback if you want one less vendor.
- **Auth:** Supabase Auth. Apple Sign-In + Google + email magic link, no passwords. Free up to 50K MAU, then $0.00325/MAU. Cheapest of the managed options at the scale this app is going to hit.
- **Realtime (TinyWall live updates):** Supabase Realtime (Postgres changes channel). Already paid for, scales to thousands of concurrent connections on the free tier, and you don't run a separate WebSocket server.
- **IAP / monetization:** RevenueCat for App Store + Play Store. Stripe (via RevenueCat Web Billing) for event-host plans purchased on tinybooth.com. Free tier of RevenueCat covers up to $2.5K MTR.
- **CI/CD:** GitHub Actions for lint / typecheck / test / web deploy. EAS Build for iOS + Android binaries with EAS Submit pushing to TestFlight + Play Internal track. EAS Update for OTA JS bundle pushes between native releases.
- **Monorepo:** Turborepo with pnpm workspaces. Apps: `apps/mobile` (Expo), `apps/wall` (Next.js, the existing TinyWall), `apps/web` (tinybooth.com marketing + dashboard). Shared packages: `packages/api-types`, `packages/ui-tokens`, `packages/messages` (the random-message library from the old Swift app).

---

## 1. Cross-Platform Mobile Framework

### Options

| Option | Pros | Cons |
|---|---|---|
| **Expo (React Native)** | Officially the recommended way to start a new React Native project. EAS Build removes the need to babysit Xcode/Gradle. EAS Update gives OTA JS pushes that bypass App Store review. Huge plugin ecosystem. TypeScript native. New Architecture (Fabric + JSI) closed most of the perf gap with Flutter. Hireable. | JS bridge overhead still exists for some libraries. Native modules require dev builds (no Expo Go). Some SDK plugins lag behind native APIs by a release. |
| **Bare React Native** | Full native module control. No Expo opinions. | You manage Xcode, Gradle, Cocoapods, signing, certs yourself. No reason to do this in 2026 for a solo project; Expo's prebuild gives you the same escape hatch when you need it. |
| **Flutter** | Best raw rendering perf. Pixel-identical UI across platforms. Impeller engine is fast. | Dart, not TypeScript. Smaller talent pool. Camrynn's whole stack is TS. No code sharing with the Next.js web app. |
| **Capacitor** | Lets you reuse a Next.js / web codebase as a "native" wrapper. Fast for web devs. | Web-view based, so the camera viewfinder is a `getUserMedia` stream, not AVFoundation/CameraX. AirPrint support is shaky. Photobooth UX (live preview, fast countdown, print-quality capture) is the worst case for a webview. <5% market share. Skip. |

### Camera support

`react-native-vision-camera` (Margelo) interfaces directly with `AVCaptureSession` on iOS and CameraX on Android. It exposes ISO, shutter speed, white balance, ultra-wide, telephoto, HDR, RAW, frame processors. `expo-camera` works but pushes preview frames over the JS bridge, which means dropped frames during heavy work and weaker control over capture format. For a photobooth where the photo is the product, vision-camera is the right call. It runs fine inside Expo via a config plugin.

### AirPrint / Android print

`expo-print` wraps `UIPrintInteractionController` on iOS (the exact API the current Swift app uses in `ViewController.swift:330`) and Android's Print Framework. The Swift app's print flow is a one-line `printController.present(...)`; the Expo equivalent is `Print.printAsync({ uri })`. There is no parity gap. `react-native-print` exists as an alternative but is less maintained.

### Tablet / iPad layout

React Native handles this with `useWindowDimensions()` plus flexbox. Standard pattern: pick a tablet breakpoint at 768px, swap `flexDirection`, render different component compositions for tablet landscape vs phone portrait. `app.json` `orientation: "default"` allows both. Expo SDK 52+ supports iPad split view and Stage Manager. Tablet-first is a layout discipline, not a framework choice; both RN and Flutter handle it equally well.

### IAP

`react-native-purchases` (RevenueCat's SDK) wraps StoreKit 2 and Google Play Billing 7. It includes a Preview API mode so it doesn't crash inside Expo Go during dev. Detail in section 5.

### Build / submit pipeline

EAS Build runs Fastlane internally for iOS builds (it's not an either/or: EAS uses Fastlane under the hood). EAS Submit pushes to TestFlight and Play Internal track from a single command. For a solo dev, EAS removes the entire "set up a Mac runner, manage certs, write Fastlane lanes" project.

### What the old Swift app does that's hard on RN

Looked at `tinybooth-old/tinybooth/`:

1. **Live AVFoundation preview with countdown overlay + sequential capture** (`ViewController.swift`). Vision-camera handles this; the only real work is rebuilding the countdown UI in RN.
2. **`PhotoUtil.renderPhotostrip`** draws cropped images into a `CGContext` to compose a 2-up strip (`PhotoUtil.swift:26-65`). On RN this becomes either:
   - Server-side composition (Sharp on the Next.js API; already a dep in TinyWall), or
   - Client-side via `react-native-skia` (Shopify), which gives you the same Core-Graphics-style canvas API. Skia is the right call because the strip needs to render whether the device is online or not for AirPrint.
3. **`UIPrintInteractionController` AirPrint** (`ViewController.swift:321-338`). Direct match in `expo-print`.
4. **`UIActivityViewController` share sheet** (`PreviewViewController.swift:71`). Direct match in `expo-sharing`.
5. **`UIDevice.modelName` switch on `iPhone 8` / `iPad Air 2`** for layout tweaks (`UIDevice.swift`, `ViewController.swift:89-100`). Replace with `useWindowDimensions()` breakpoints. The model-name approach was always fragile.

**Risks specific to RN:**
- Skia compositing of photostrips needs perf testing on older Android tablets.
- AirPrint preview presentation API in `expo-print` doesn't expose every option of the native sheet (e.g., custom paper sizes). Verify the 2x6 photostrip paper size shows up.
- `react-native-vision-camera` requires a development build; you cannot ship the photobooth on Expo Go.

### Recommendation

**Expo (React Native) with the New Architecture.** Vision-camera for capture, Skia for photostrip composition, `expo-print` for AirPrint, EAS for build/submit. Single codebase covers iPad (primary), iPhone, Android tablet, Android phone. Code shares types and utilities with the Next.js apps in the same monorepo. No Flutter detour: Camrynn's whole stack is TypeScript, and the rendering perf gap is small enough not to matter for a photo capture app.

---

## 2. Backend / API

### Options

| Option | Pros | Cons |
|---|---|---|
| **Next.js API in same monorepo** | Single deploy, one set of types from `packages/api-types`, fits the existing TinyWall app. tRPC or plain REST both work. | Vercel functions cold-start ~300ms. Vercel's per-request pricing ($0.60/M) is 3x AWS Lambda ($0.20/M) at scale. |
| **Separate Express / Hono server on AWS** | Pay-as-you-go, no seat fees. Camrynn already knows Terraform from bookish. | More to operate. Worth it only at meaningful scale. |
| **AWS Amplify** | Cheaper than Vercel for multi-dev teams. | Worse Next.js DX. Solo dev doesn't need the seat-cost arbitrage. |

### Realtime

| Option | Free tier | Notes |
|---|---|---|
| **Supabase Realtime** | Free if you only listen to Postgres changes. | Already paid for if Postgres is on Supabase. Channels for broadcast + presence on top of Postgres CDC. |
| **Pusher Channels** | 200 concurrent connections, 200K msgs/day. | Daily cap is harsh during a single big event. |
| **Ably** | 6M messages/month. | More generous monthly cap, but it's another vendor for one feature. |
| **Raw WebSockets on Vercel** | n/a | Vercel functions don't hold open WS. You'd need a separate process. Skip. |
| **SSE from Next.js** | Free | Works on Vercel but each open SSE counts as an active function invocation, which burns the function-hours budget. Already what TinyWall does today; fine for tiny scale, breaks at 50+ concurrent TVs. |

### Recommendation

**Start: single Next.js app on Vercel Pro, Supabase Postgres + Realtime for data and live updates.** The whole point of the existing TinyWall stack is that it works; don't rip it out. When the Vercel bill crosses ~$500/mo, lift the API into a Hono service on AWS Lambda behind API Gateway with Terraform (mirror the bookish layout: `terraform/environments/staging`, `terraform/environments/production`, shared `terraform/modules/`). For TinyWall realtime, switch from the current SSE-from-Next-API approach to Supabase Realtime channels. Browsers subscribe to `posts:event_id=eq.xxx`. No long-running serverless invocations, no Pusher bill, scales to thousands of concurrent TVs on the free tier.

---

## 3. Database

### Options

| Option | Pros | Cons |
|---|---|---|
| **Vercel Postgres** | Was integrated into Vercel deploys. | Vercel sunsetted Vercel Postgres in Q4 2024 / Q1 2025 and silently migrated everyone to Neon. The TinyWall DB is technically already on Neon; the "Vercel Postgres" branding is dead. Migration is forced regardless. |
| **Supabase Postgres** | Postgres + Auth + Storage + Realtime in one product. RLS for multi-tenant event data. Generous free tier (500MB DB, 5GB bandwidth, 1GB storage). $25/mo Pro tier covers all of TinyBooth realistically. TypeScript types generated from schema. | Connection pooling has had hiccups historically, fixed via Supavisor. |
| **AWS RDS** | Familiar from bookish (presumably). Predictable pricing. Full Postgres control. | $13+/mo minimum even idle. Operates at a different tier of effort than Supabase. Overkill until there's revenue. |
| **Neon** | Where Vercel parked the old Postgres. Branching is genuinely useful for PR previews. | Ties you to Vercel's marketplace billing. Auto-scale to zero is great until the first request after sleep is 2s. |

### Storage

| Option | Free tier | Egress | Notes |
|---|---|---|---|
| **AWS S3** | 5GB / 12mo | $0.09/GB out | Standard. Pricey egress eats the photo wall budget. |
| **Supabase Storage** | 1GB | included up to limit | RLS-aware. Same dashboard as DB. |
| **Vercel Blob** | included on plan | counted against bandwidth | Convenient for Next.js, expensive for hot photo serving. |
| **Cloudflare R2** | 10GB / 1M Class A ops / 10M Class B ops per month | **$0/GB out** | S3-compatible. The free tier alone covers many small events, and there is literally no egress charge ever. |

### Recommendation

**Supabase Postgres for data, Cloudflare R2 for photo blobs.** Supabase replaces Vercel Postgres and eliminates the Auth + Realtime vendors at the same time. R2's zero egress is the right answer for a free-tier-must-be-cheap photo product where guests pull thumbnails dozens of times during an event. Use `@aws-sdk/client-s3` against R2's S3-compatible endpoint; Sharp (already in TinyWall) handles thumbnail generation before upload. Keep Supabase Storage as a backup option if R2 becomes painful, since you're already paying for it.

---

## 4. Auth

### Options

| Option | Free tier | Then | Apple Sign-In | Notes |
|---|---|---|---|---|
| **Supabase Auth** | 50K MAU free | $0.00325/MAU | Yes, native + web | Cheapest. Bundled with the DB. RLS works because Supabase Auth issues the JWT the DB enforces against. |
| **Clerk** | 10K MAU free | $0.02/MAU | Yes | Best Next.js DX, prebuilt UI. Roughly 6x more expensive at scale than Supabase. |
| **Auth.js (NextAuth)** | Free, you host | Free | Yes (manual JWT setup for native) | Works on web. Native iOS/Android sign-in flows are a separate exercise. Most ops effort of the three. |

App Store rule: if you offer any third-party social auth, Apple Sign-In is required. All three providers handle this.

### Recommendation

**Supabase Auth.** Cost (free for the realistic lifetime of this app), already bundled with the chosen DB, and RLS lets you write security policies once in SQL instead of re-checking ownership on every API route. Apple + Google + magic link, no passwords, exactly as scoped. Skip Clerk: the per-MAU cost adds up fast on a free-tier app and the RLS integration is bolt-on, not native.

---

## 5. IAP / Monetization

### Options

| Option | Pros | Cons |
|---|---|---|
| **RevenueCat** | One SDK across iOS, Android, web. Handles receipt validation, sub status, refunds, grace periods, webhooks, A/B price testing, prebuilt paywall UI. Free up to $2.5K monthly tracked revenue (MTR), then 1% over that. | Adds a vendor. Webhook flow for entitlements adds complexity. |
| **react-native-iap (StoreKit + Play Billing direct)** | No vendor cut. Full control. | Receipt validation is the hard part and you write it yourself. Subscription edge cases (grace, billing retry, family sharing) become your problem. |
| **Stripe direct (web only)** | Web-only purchases for event-host plans bypass Apple's 30%. | Doesn't help with in-app purchases. |

### Apple's rules in 2026

The April 2025 Epic v Apple ruling forced Apple to allow external payment links in the US App Store with no commission. Apps in the US can include buttons / links that send users to a web checkout. Outside the US, the entitlement system (StoreKit External Purchase Entitlement) applies but with conditions. Practical guidance:

- **In-app purchases of digital content consumed in the app must use IAP** (Apple's 30%, or 15% under Small Business Program for under-$1M/year, which TinyBooth qualifies for). This covers things like "remove watermark" or "unlock custom messages."
- **Subscriptions for services consumed outside the app** (the event host dashboard, web-based event management) can be sold on tinybooth.com via Stripe with no Apple cut. The mobile app can link out to that purchase flow in the US storefront.
- **Promo codes and pricing comparisons are now allowed** post-ruling.

### Recommendation

**RevenueCat for everything in-app, Stripe via RevenueCat Web Billing for web purchases on tinybooth.com.** RevenueCat's free tier (under $2.5K MTR) means it costs nothing until the app has real revenue, and at 1% over that it's cheaper than rebuilding subscription infra. Single entitlement system across iOS, Android, and web. Strategy:

- Free tier (no IAP): app fully usable, watermark on photostrips.
- "Remove watermark" one-time IAP via RevenueCat (Small Business Program rate of 15%).
- Event-host plan (dashboard, branding, longer retention, higher guest counts): sold on web via Stripe. App links out to it for US users; for international users, fall back to IAP entitlement to stay App Store compliant.

---

## 6. CI/CD

### Recommendation

**GitHub Actions for everything except mobile binaries; EAS Build for iOS + Android.**

Pipelines:

- **`ci.yml`** (push + PR): pnpm install with cache, `turbo run lint typecheck test build` across the whole monorepo. Turbo's remote cache (free on Vercel) keeps this under a couple minutes.
- **`web-deploy.yml`**: Vercel auto-deploys from `main` and PR branches; nothing to wire in GHA. PR previews ship a unique URL automatically.
- **`mobile-build.yml`** (manual + tag dispatch): runs `eas build --platform all --profile production` then `eas submit --platform all --profile production`. EAS handles certs, provisioning, and pushes to TestFlight + Play Internal track in one command.
- **`eas-update.yml`** (push to `main`, mobile-only paths): `eas update --branch production` ships a JS bundle OTA to existing installs without an App Store review.

Preview environments per PR: Vercel handles web previews automatically; for mobile, `eas build --profile preview` produces an internal-distribution build per branch when needed. You probably don't want one per PR (build credits aren't infinite), but per release branch is reasonable.

---

## 7. Monorepo vs Polyrepo

### Options

| Option | Pros | Cons |
|---|---|---|
| **Turborepo + pnpm workspaces** | Stays out of your way. Vercel-native (Camrynn already deploys there). Remote cache free. Simple `turbo.json`. | No dependency-graph visualizer. Less opinionated than Nx (which is fine for this size). |
| **Nx** | Generators, executors, dependency graph viz, plugin ecosystem. | Opinionated structure. More to learn. Overkill for 3 apps + a few packages. |
| **Polyrepo** | No tooling. | Shared types live in a published package or get duplicated. PR coordination across repos is painful for one developer. |

### Recommendation

**Turborepo with pnpm workspaces.** Layout:

```
tinybooth/
  apps/
    mobile/          # Expo app (TinyBooth)
    wall/            # Existing TinyWall Next.js app
    web/             # tinybooth.com marketing + event-host dashboard
  packages/
    api-types/       # Shared TS types (events, posts, photos, users)
    api-client/      # Typed fetch client / tRPC client used by mobile + web + wall
    ui-tokens/       # Brand color/spacing/type tokens, consumed by RN + Tailwind
    messages/        # Random message library migrated from old Swift app
    config/          # Shared eslint, tsconfig, prettier configs
  infra/             # Terraform (only when the AWS migration happens)
```

Single source of truth for the event schema, the random-message library (verbatim from `tinybooth-old/tinybooth/ViewController.swift:43` plus future additions), and the brand tokens used by both Tailwind on web and the RN style system on mobile.

---

## Risks & Open Questions

1. **AirPrint paper sizes for 2x6 photostrips.** `expo-print` exposes Apple's standard paper picker but custom photostrip paper (4x6, 2x6) needs a real-device test against typical photobooth printers (DNP, Mitsubishi). May need to fall back to a small custom native module if the paper size dropdown isn't right.
2. **Vision-camera + Skia perf on cheap Android tablets.** Composing a 1200x1800 photostrip while the camera preview is live could chug on a $200 Android tablet. Need to benchmark; worst case, render the strip server-side via Sharp on the Next.js API and skip Skia client-side.
3. **Vercel Hobby is non-commercial.** TinyWall's current free deploy technically violates Vercel's ToS the moment monetization ships. Pro is $20/mo per seat. Acceptable, but factor it into the operating cost.
4. **Supabase free-tier inactivity pause.** Free Supabase projects pause after 7 days of inactivity. If a paying event host hits a paused project, that's an outage. Move to Pro ($25/mo) before the first real customer.
5. **App Store external-link entitlement is US-only.** The clean "send users to Stripe" flow only works on the US storefront. International users still need IAP for paid features inside the app, which means you're maintaining two purchase flows or accepting the 15% SBP cut globally.
6. **Bundle ID reuse from `tinybooth-old`.** Need to confirm the existing bundle ID can be brought into the Expo project unchanged (it can; it's just an Info.plist value via `app.json` `ios.bundleIdentifier`). Existing users get the update; ratings carry over.
7. **R2 vs Supabase Storage decision is reversible.** Both are S3-compatible enough that the storage layer can be a single interface in `apps/wall/src/lib/storage.ts` (it already is) and swapped in one file. Pick R2 first; revisit if there's a reason.
8. **TinyWall data download.** Per `PROMPT.md:23`, the existing Vercel Postgres data needs to be exported locally before any migration. This is a `pg_dump` against the connection string in `tinybooth-wall/.env`. Not a tech-stack decision but a prerequisite to acting on this doc.

---

## Sources

Mobile framework:
- [Expo official docs (recommended way to start RN)](https://docs.expo.dev/)
- [React Native vs Flutter vs Expo vs Lynx 2026](https://dev.to/krunal_groovy/react-native-vs-flutter-vs-expo-vs-lynx-2026-which-to-choose-for-your-app-30h6)
- [Flutter vs React Native in 2026 (TechAhead)](https://www.techaheadcorp.com/blog/flutter-vs-react-native-in-2026-the-ultimate-showdown-for-app-development-dominance/)
- [Capacitor vs React Native 2025 (NextNative)](https://nextnative.dev/blog/capacitor-vs-react-native)

Camera:
- [react-native-vision-camera vs expo-camera (PkgPulse)](https://www.pkgpulse.com/blog/react-native-vision-camera-vs-expo-camera-vs-expo-image-picker-2026)
- [Patrick Skinner: Expo Camera vs VisionCamera](https://blog.patrickskinner.tech/react-native-camera-expo-vs-visioncamera-what-you-need-to-know)
- [VisionCamera docs](https://visioncamera.margelo.com/docs)

Print:
- [expo-print official docs (AirPrint + Android Print)](https://docs.expo.dev/versions/latest/sdk/print/)
- [Expo print package source](https://github.com/expo/expo/tree/main/packages/expo-print)

IAP / monetization:
- [RevenueCat Expo + React Native docs](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [RevenueCat: single Expo app with subs on iOS, Android, web](https://www.revenuecat.com/blog/engineering/build-a-single-expo-app-with-subscriptions-on-ios-android-and-web-using-revenuecat/)
- [react-native-iap vs RevenueCat (NativeLaunch)](https://nativelaunch.dev/articles/compare/revenuecat-vs-native-iap)

Apple App Store rules:
- [Apple anti-steering ruling (RevenueCat blog, May 2025)](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy/)
- [Apple updates App Store guidelines for external payments (9to5Mac)](https://9to5mac.com/2025/05/01/apple-app-store-guidelines-external-links/)
- [TechCrunch: Apple US external payments rule change](https://techcrunch.com/2025/05/02/apple-changes-us-app-store-rules-to-let-apps-redirect-users-to-their-own-websites-for-payments/)

Backend / hosting:
- [Vercel Hobby plan limits (non-commercial)](https://vercel.com/docs/plans/hobby)
- [Vercel pricing](https://vercel.com/pricing)
- [Next.js on AWS Lambda vs Vercel cost comparison (Stacktape)](https://www.stacktape.com/blog/nextjs-price-performance-comparison-aws)

Database:
- [Vercel Postgres transition to Neon](https://neon.com/docs/guides/vercel-postgres-transition-guide)
- [Migrate from Vercel Postgres to Supabase (Supabase docs)](https://supabase.com/docs/guides/platform/migrating-to-supabase/vercel-postgres)
- [Supabase pricing](https://supabase.com/pricing)

Storage:
- [Cloud storage pricing comparison: R2, S3, Supabase (BuildMVPFast)](https://www.buildmvpfast.com/api-costs/cloud-storage)
- [Supabase vs R2 (BuildMVPFast)](https://www.buildmvpfast.com/compare/supabase-vs-r2)

Realtime:
- [Supabase Realtime pricing](https://supabase.com/docs/guides/realtime/pricing)
- [Pusher pricing 2025 (Ably)](https://ably.com/topic/pusher-pricing)
- [Pusher vs Supabase Realtime (Ably)](https://ably.com/compare/pusher-vs-supabase)

Auth:
- [Supabase Apple Sign-In docs](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Clerk vs Supabase Auth vs NextAuth.js production reality (Better Dev)](https://medium.com/better-dev-nextjs-react/clerk-vs-supabase-auth-vs-nextauth-js-the-production-reality-nobody-tells-you-a4b8f0993e1b)
- [Authentication Showdown: Auth0 vs Clerk vs Supabase](https://www.thestartupstarterkit.com/newsletter/2025-12-14-authentication-showdown)

Monorepo:
- [Turborepo + React Native + Next.js 2025 production guide](https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af)
- [Turborepo vs Nx migrated twice (Navanath Jadhav)](https://navanathjadhav.medium.com/turborepo-vs-nx-i-migrated-a-monorepo-twice-to-compare-38e95e434273)
- [byCedric/expo-monorepo-example](https://github.com/byCedric/expo-monorepo-example)

CI/CD:
- [Expo iOS build process (uses Fastlane internally)](https://docs.expo.dev/build-reference/ios-builds/)
- [React Native build pipeline using EAS and Fastlane](https://medium.com/@ali.shabbir6706/react-native-build-pipeline-guide-using-eas-and-fastlane-d71889ef8d07)

Tablet layout:
- [React Native responsive design 2025 guide](https://reactnativeexample.com/react-native-responsive-design-tutorial-2025-complete-guide/)
- [Creating adaptive responsive UIs in React Native (LogRocket)](https://blog.logrocket.com/creating-adaptive-responsive-uis-react-native/)
