# TinyBooth + TinyWall Monetization Research

**Last Updated:** April 2026
**Author:** Research pass for Camrynn
**Scope:** Pricing models, App Store and Play Store IAP rules, web payments via Stripe, RevenueCat tradeoffs, and a concrete recommended plan with unit economics.

---

## Executive Summary (TL;DR)

**Recommended structure: three tiers, hybrid pay-per-event credits + one optional subscription.**

| Tier | Price | What you get | Where it's sold |
|---|---|---|---|
| **Free** | $0 | Full TinyBooth photobooth app, all layouts, all filters, full random message library, AirPrint, save to Camera Roll, IG-format share. TinyBooth watermark on photostrips and IG share. TinyWall guest uploads at events you didn't pay for stay capped at low limits and 7-day retention. | Default, no signup. |
| **Event Pass** | $14.99 per event (IAP) / $12.99 (web) | One event, up to 24 hours, up to 150 guests, custom branding (logo, colors), watermark removed from strips, dashboard access, 60-day retention, bulk export, 50 guest email/text deliveries. | iOS IAP (consumable), Play Billing (consumable), Stripe on web. |
| **Event Pass Plus** | $39 per event (IAP) / $34 (web) | Same as Event Pass but unlimited guests, 90-day retention, 250 email/text deliveries, custom message library, priority processing for the IG share. | iOS IAP, Play Billing, Stripe on web. |
| **Pro Host** (optional, year 2) | $9.99/month or $79/year (IAP only on mobile) | 1 event per month included at Plus tier, rolls over up to 3, plus host-side perks: saved branding presets, recurring event templates, lower per-guest cost on overages. | iOS IAP, Play Billing, Stripe on web. Skip at launch. |

**Core moves:**

1. **TinyBooth standalone (no event) stays 100% free forever** so existing users never feel betrayed. The only friction is a small TinyBooth wordmark on the strip footer. They can also upgrade strips one-off via a $1.99 "remove watermark from this strip" consumable if they don't want a full event.
2. **Events are the paywall.** Custom branding, dashboard, longer retention, higher TinyWall guest counts, watermark removal on event strips, bulk export, and email/text delivery all live behind the Event Pass purchase.
3. **Per-event credits beat subscriptions** for this audience. Most hosts use a photo booth two to four times a year max. POV Camera and Lense both confirm this with one-off pricing.
4. **Sell on iOS IAP, Play Billing, and Stripe (web).** Charge ~15% less on web ($12.99 vs $14.99) to nudge the buyers who care, but never mention the web price inside the iOS app outside the US (anti-steering rules outside the US still bite). Inside the US storefront, after the April 2025 Epic ruling, you can show external links.
5. **Use RevenueCat from day one** for both iOS and Android. Free up to $2,500 MTR, then 1% of gross. The time saved on receipt validation, restore purchases, and Family Sharing is worth more than 1% for a solo dev.
6. **Watermark removal must be IAP on iOS.** It's digital content unlocked in the app. There is no physical-services exemption that covers it.
7. **TinyWall guest uploads are always free and never gated by IAP** because the guest is not the buyer; the host already paid for the event slot.

**Estimated unit economics (target: under $0.10/month per free user, $1-3/event for paid):**

- Free TinyBooth user (no event): ~$0.00/month. No cloud, no storage, photos go to Camera Roll. Only cost is App Store hosting.
- Free TinyWall guest (at a paid event): cost is amortized into the host's Event Pass.
- Paid Event Pass (150 guests, ~10 photos each, 1500 photos at ~2 MB each = 3 GB): S3 storage at $0.023/GB/month for 60 days = $0.14, transfer at $0.09/GB out (assume each photo is downloaded once) = $0.27, Twilio SMS at $0.0083/msg x 50 = $0.42, SES email at $0.0001/msg x 50 = $0.005. Total cloud cost ≈ **$0.85/event**. Apple takes 30% of $14.99 = $4.50. Net **$9.64**, gross margin ~91%. Drops to $9.49 after 1% RevenueCat. Once you hit Apple Small Business Program (under $1M/year, 15% commission), net jumps to $11.99 less RevenueCat = ~$11.85.

---

## 1. Pricing Models That Work for Similar Apps

### 1.1 Freemium with watermark removal

**Conversion benchmarks:**

- Freemium mobile apps convert at a **2.18% median** to paid. Hard paywall apps hit 12.11% median, but that's not your model. ([RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/), [Geneo benchmarks](https://geneo.app/query-reports/freemium-conversion-rate-benchmarks))
- 3-5% is "good" for freemium self-serve, 6-8% is "great" (Canva, Trello, Typeform sit in this band). ([Lenny's Newsletter](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion))
- Watermark removal is one of the highest-converting freemium levers because it's visible, embarrassing, and one click to fix. CapCut tested a 7-free-watermark-free-exports-per-month cap to push conversions in some regions. ([CapCut watermark guide](https://maestra.ai/blogs/how-to-remove-capcut-watermark-for-free))

**Implication for TinyBooth:** Realistic conversion is 2-4% of monthly actives buying at least one Event Pass per year. If we end up with 50,000 MAU on the modernized free app, that's 1,000-2,000 Event Pass purchases/year. At blended ~$15 net after store fees, that's roughly $15K-30K/year from event passes alone. Stretch case 6% conversion = $45K. This rounds out as passive income, not a primary salary.

### 1.2 Per-event pricing (direct competitors)

Looking at apps that target the same use case (no-app-required QR uploads at parties / events):

- **POV Camera** (pov.camera): Free up to 10 guests. **$4.99 for up to 25 guests**, scaling up to 250+. Per-event purchase. Guests scan a QR. ([POV pricing](https://pov.camera/pricing))
- **Lense** (lense.app): Free up to 7 guests. **$34.99 flat** for unlimited photos. Optional video add-on. ([Lense pricing](https://lense.app/pricing))
- **Veri**: **$129 per package** for up to 5 events, with frequent specials dropping to under $100. Photos auto-upload during the event window. ([WeddingWire forum](https://www.weddingwire.com/wedding-forums/veri-app-vs-wws-wedsocial-app/663e5f1f569431a1.html))
- **WedSocial**: Free, monetizes through their broader wedding-website product. ([WeddingWire](https://www.weddingwire.com/wedding-forums/veri-app-vs-wws-wedsocial-app/663e5f1f569431a1.html))
- **Joy**: Wedding website + photo sharing. Free on the photo side; paid for the website tier.

**Pricing band: $5 for tiny events, $30-40 for typical wedding/birthday tier, $100+ for multi-event packages.** TinyBooth's recommended $14.99 / $39 sits squarely in the proven middle of that band. It's notably cheaper than a real photo booth rental (US average **$550-1,100 for 3 hours**, open-air booths **$870 average**, 360 booths **$1,170 average**, Marky/WeddingWire data 2025). ([Puddles 2025 costs](https://www.puddlesphotobooth.com/2025-photo-booth-rental-costs), [Marky 2025 guide](https://www.markybooth.com/how-much-does-a-photo-booth-cost-for-a-wedding/))

### 1.3 Lifetime unlock vs subscription vs credits

**For occasional-use apps, credits / one-time purchases beat subscriptions.** Sources agree:

- Apps providing occasional utility perform better with one-time IAP because users invest only when they perceive value. Subscriptions work for daily-use apps (fitness, productivity), not seasonal ones. ([Qonversion guide](https://qonversion.io/blog/one-time-payment-or-subscription))
- Hybrid models (consumables + optional subscription for power users) see **~30% higher revenue** vs single-model approaches. ([Mobile App Monetization 2025 guide](https://www.alimertgulec.com/en/blog/mobile-app-monetization-strategies-2025))

A photobooth host throws maybe 1-4 events per year. A subscription would trigger immediate cancel-after-purchase behavior, churning your base and tanking lifetime value. The Event Pass model is a clean fit: pay for the event you're hosting, no recurring guilt.

**Recommendation:** Lead with per-event consumables. Add a **Pro Host** subscription in year 2 once you have data on which hosts are repeat customers. Don't ship the subscription at launch; it'll dilute focus and add support load.

### 1.4 Why not a lifetime unlock?

Lifetime unlocks fit apps where the marginal cost of serving a user is near zero. TinyBooth's paid features have real per-event costs (storage, SMS, email). A $99 lifetime unlock means you're on the hook forever for someone's twin's quinceañera in 2031. Per-event pricing keeps your costs aligned with your revenue.

---

## 2. App Store IAP Compliance (Apple)

### 2.1 The core rule (Guideline 3.1.1)

> "If you want to unlock features or functionality within your app (such as subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality, such as license keys, augmented reality markers, QR codes, cryptocurrencies and cryptocurrency wallets, etc."

Source: [App Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)

**Watermark removal = digital content unlocked in the app.** That's IAP, no exceptions. Pretending otherwise gets the app rejected.

### 2.2 What's IAP-required vs what's exempt (Guideline 3.1.5)

> "If your app enables people to purchase goods or services that will be consumed outside of the app, you must use purchase methods other than in-app purchase to collect those payments, such as Apple Pay or traditional credit card entry."

Source: [App Review Guidelines 3.1.5](https://developer.apple.com/app-store/review/guidelines/#payments)

Apple's published examples of "consumed outside the app":
- Realtime person-to-person services (tutoring, medical consults, real estate tours, fitness training)
- Physical goods shipped to customers
- Physical event tickets
- Parking, ride-share, food delivery

**Could "event hosting" qualify?** It's the only borderline case. Argument for: the "event" is a physical real-world gathering and the host is paying for service delivered at that gathering. Argument against (and this is what reviewers will say): the unlocked features (custom branding, dashboard, watermark removal, longer retention, higher upload counts) are **delivered through the app and through cloud features**, not at the physical venue. The host opens the dashboard on the web or app to see results. That makes it digital content.

**Verdict: assume Event Pass must go through IAP on iOS.** Don't try to thread the physical-services needle on launch. Apple has rejected creative interpretations consistently. If you want to test the boundary, get a TestFlight version reviewed first and ask your reviewer in writing.

### 2.3 The Reader app rule

Reader apps (apps whose primary function is delivering already-purchased magazines, newspapers, books, music, video, or audio) can apply for the **External Link Account Entitlement**, which lets them link out to the web for account creation and subscription management. Apps using this entitlement **cannot offer IAP at all** on iOS, iPadOS, or tvOS.

Source: [Reader app distribution](https://developer.apple.com/support/reader-apps/), [External Link Account Entitlement update](https://developer.apple.com/news/?id=grjqafts)

**TinyBooth does not qualify as a reader app.** It's a creation tool, not a content delivery app. Don't try to invoke this.

### 2.4 The 2024-2026 external-purchase rules in the US (post-Epic)

Timeline:

- **April 30, 2025:** Judge Yvonne Gonzalez Rogers rules Apple violated the 2021 anti-steering injunction. Apple is barred from charging any commission on US purchases made through external links, and barred from restricting how developers communicate about external payment options. ([MacRumors coverage](https://www.macrumors.com/2025/04/30/apple-app-store-anti-steering-injunction-violation/))
- **May 1, 2025:** Apple updates the App Review Guidelines. Section 3.1.1(a): "developers may apply for entitlements to provide a link in their app to a website the developer owns or maintains responsibility for in order to purchase digital content or services. **These entitlements are not required for developers to include buttons, external links, or other calls to action in their United States storefront apps.**" ([9to5Mac](https://9to5mac.com/2025/05/01/apple-app-store-guidelines-external-links/), [Apple developer news](https://developer.apple.com/news/?id=3ozbk628))
- **December 11, 2025:** The Ninth Circuit modifies the injunction. Apple can charge **some** fee on external purchases (lower than the previous 27%) to recover IP costs. Exact rate TBD. ([MacRumors](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/))
- **March 2026:** Ninth Circuit denies rehearing. Heading to Supreme Court. ([AppleInsider](https://appleinsider.com/articles/26/04/06/epic-vs-apple-lawsuit-over-app-store-fees-is-moving-to-the-supreme-court-again))

**Practical state today (April 2026):**

- **US storefront iOS app:** You can include a button or link inside the app that opens Safari to your Stripe checkout page. No special entitlement, no in-app modal warning required, you can write your own button copy. Apple may charge a small commission (rate uncertain pending Supreme Court). Plan for **5-10% Apple commission on external purchases** as a conservative baseline.
- **All other storefronts (EU, UK, JP, AU, etc.):** You must use the older entitlement programs (StoreKit External Purchase Link Entitlement in the EU; reader-app entitlement elsewhere) and Apple charges 17% (subscriptions after year one) or 27% (other) on external purchases. Add a mandatory in-app warning sheet before linking out. ([RevenueCat anti-steering breakdown](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy/), [Adapty US ruling](https://adapty.io/blog/new-us-ruling-on-external-ios-payments/))

### 2.5 Subscription rules

If you ship the Pro Host subscription:

- Must use auto-renewable subscriptions in App Store Connect.
- Must support **Family Sharing** for shared subscriptions if you want them shareable. Toggle in App Store Connect under in-app purchase config. Family Sharing only works with auto-renewable subscriptions and non-consumable IAPs, not consumables. ([Apple Family Sharing IAP setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases/))
- Must implement **Restore Purchases** (Guideline 3.1.1: "Restore feature must be implemented for non-consumable purchases and auto-renewable subscriptions").
- Must let users initiate **account deletion** in-app (Guideline 5.1.1(v), required since June 30, 2022). ([Apple offering account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/))
- Must show a clear sign-up sheet that includes price, billing period, and renewal terms before subscription purchase.

### 2.6 Apple Small Business Program (15% rate)

Eligible if you earned **under $1M USD in proceeds** in the prior calendar year. Drops the standard 30% commission to **15%** on all paid apps and IAP. New developers qualify by default. If you cross $1M during a year, the 30% rate kicks in for the rest of the year; you can re-qualify the following year if you drop below.

Source: [App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)

**TinyBooth qualifies day one.** Cuts your blended IAP take rate from 30% to 15%, which is huge for unit economics. An Event Pass at $14.99 nets $12.74 instead of $10.49.

### 2.7 Apple Sign-In requirement

If TinyBooth offers any third-party login (Google Sign-In, Facebook, etc.), it **must also offer Sign In with Apple** as a peer option. (Guideline 4.8.) Email magic-link-only logins are exempt. Source: [App Review Guidelines 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)

---

## 3. Play Store IAP Rules (Google)

### 3.1 Core rule

Google Play Billing is required for digital content sold inside Android apps, with the same general spirit as Apple's 3.1.1. Service fee is **30% standard, 15% reduced** through the equivalent of a small-business program (auto-applied to first $1M/year per developer). Subscriptions drop to 15% after year one regardless. ([Service fees](https://support.google.com/googleplay/android-developer/answer/112622))

### 3.2 User Choice Billing

Google's User Choice Billing lets users pick between Play Billing and an alternative processor at checkout. Available in the EEA, UK, Australia, Brazil, India, Indonesia, Japan, South Africa, and South Korea. Service fee is **reduced by 4%** (so 26% standard, 11% reduced) for transactions through the alternative processor. ([User Choice Billing](https://support.google.com/googleplay/android-developer/answer/13821247))

### 3.3 US-specific changes

After the Epic v. Google verdict, Google is required (subject to ongoing appeals) to allow US developers to use alternative billing and to link to external payments. Implementation details are still rolling out as of April 2026. ([Neon Commerce summary](https://www.neonpay.com/blog/google-plays-new-u.s.-billing-linking-policies-what-game-developers-need-to-know))

### 3.4 Practical TinyBooth plan for Android

Use Google Play Billing for the in-app Event Pass purchase (matches iOS UX). Add an external Stripe link on the US storefront. Skip User Choice Billing complexity at launch; the 4% savings isn't worth the integration work.

---

## 4. Stripe for Web Purchases

### 4.1 What you can sell on the web

The dashboard at tinybooth.com is your unrestricted sales channel. Anything: Event Passes, Pro Host subscriptions, custom-branded packages, white-label deals. Stripe processing fees are **2.9% + $0.30** per US transaction. On a $12.99 Event Pass: Stripe takes $0.68, you net $12.31. Compare to iOS IAP at 15% Small Business: $12.99 - $1.95 = $11.04. **Web nets you ~$1.27 more per sale.**

### 4.2 Anti-steering: what the iOS app can and can't say

This is where the rules bite hardest.

**Inside the US storefront iOS app (post-May 2025):**
- You can show a button labeled "Buy on web" or "Get Event Pass on tinybooth.com" with a link.
- You can mention the web price.
- Apple may still charge a small commission (~5-10%, rate TBD post-Supreme-Court).
- Source: [Apple developer news May 2025](https://developer.apple.com/news/?id=3ozbk628)

**Outside the US (EU, UK, etc.):**
- You need the External Purchase Link Entitlement (or country-specific equivalent).
- You must show Apple's mandatory "you are leaving the app" interstitial sheet.
- You can only have one external link per app, on one screen.
- You're charged 17-27% on external purchases.
- Source: [RevenueCat app-to-web purchase guide](https://www.revenuecat.com/blog/engineering/app-to-web-purchase-guidelines/)

**Inside the Android app (US):** Looser. You can mention the web option without major restriction post-Epic-v-Google.

**Practical recommendation:** At launch, don't show external links inside the iOS app. Just sell Event Passes via IAP. Once the Supreme Court ruling settles (probably 2027), revisit with proper A/B test data. The 15% Small Business rate already gets you most of the way there; chasing the last 10% with anti-steering buttons isn't worth the support load and review-rejection risk on day one. **Sell the web option to people who hit tinybooth.com directly** (search, social referral) and keep the in-app flow clean.

### 4.3 Sales tax

Stripe Tax handles US sales tax registration and collection for ~$0.50/transaction. On digital goods, you owe sales tax in roughly 30+ US states. Apple and Google handle this for you on IAP. Budget for Stripe Tax if you sell direct on the web at any meaningful volume.

---

## 5. RevenueCat

### 5.1 Pros

- **30 minutes to integrate** vs ~80 hours for raw StoreKit 2 + Play Billing + receipt validation servers + webhooks. ([Swift Kit comparison](https://theswiftk.it.com/blog/storekit-2-vs-revenuecat-ios-subscriptions))
- **Single SDK** for iOS, Android, web (Stripe), and React Native / Flutter. Critical for a cross-platform codebase.
- Handles **server-side receipt validation, restore purchases, Family Sharing entitlements, refunds, and subscription state changes** out of the box.
- Built-in **paywall A/B testing** and analytics dashboards. Saves writing your own.
- Migration off RevenueCat is straightforward (it uses StoreKit 2 under the hood, your products in App Store Connect / Play Console don't change). Low lock-in.
- Supports Stripe as a payment provider in their billing system, so you can unify analytics for IAP + web purchases. ([RevenueCat Why](https://www.revenuecat.com/why-revenuecat))

### 5.2 Cons

- **Fee is 1% of gross revenue (before store cuts).** On $100K gross, you pay $1,000 even though after Apple's 30% you only see $70K. Effective rate against net is ~1.43%. ([MetaCTO breakdown](https://www.metacto.com/blogs/the-real-cost-of-revenuecat-what-app-publishers-need-to-know))
- **Free tier ends at $2,500 MTR** (monthly tracked revenue). Above that, paid plans kick in. ([RevenueCat pricing](https://www.revenuecat.com/pricing/))
- One more SaaS dependency. If RevenueCat has an outage your purchases stall (rare; their SLA is solid).

### 5.3 Recommendation

**Use RevenueCat from day one.** The first ~$2,500/month is free, which covers your launch and probably your first year unless TinyBooth blows up. The 1% fee at scale is cheap insurance against the dozens of subtle StoreKit / Play Billing bugs that eat indie developers' weekends.

If TinyBooth ever crosses $50K/month MTR ($500/month RevenueCat fee), reevaluate. Don't pre-optimize.

---

## 6. Recommended Monetization Plan

### 6.1 Tiers and pricing

**Free (no signup, no card on file):**
- Full TinyBooth photobooth app on iPad and phone.
- All photo strip layouts (1x4, 2x2, 1x3, 1x6, single, plus IG-format square share).
- All filters and effects.
- Full random message library (the existing one, verbatim, plus any additions you ship).
- AirPrint to physical photo printers.
- Save to Camera Roll.
- IG-format share with TinyBooth wordmark in the footer.
- TinyWall guest uploads at any event (guest never pays, never signs up).
- For the host side: create a free TinyWall room (no event branding, 25-guest cap, 7-day photo retention, no email/SMS delivery, no dashboard export).

**Strip Unlock (consumable, $1.99, IAP only):**
- Removes the watermark from the most recent photostrip the user took. One-shot, doesn't unlock anything else. For users who want a clean strip but aren't hosting a real event.

**Event Pass ($14.99 IAP / $12.99 web, consumable):**
- One event, up to 24 hours of active uploads.
- Up to 150 TinyWall guest uploads.
- Custom event branding (logo, theme colors applied to strips and the TinyWall view).
- Watermark removed from strips and IG shares for that event.
- Web dashboard at tinybooth.com/dashboard: view all photos from the event, download all, share links.
- 60-day photo retention after event end.
- Up to 50 guest email/SMS deliveries (Twilio + SES backed).
- Bulk export (zip download) from the dashboard.

**Event Pass Plus ($39 IAP / $34 web, consumable):**
- Same as Event Pass plus:
- Unlimited TinyWall guest uploads.
- 90-day photo retention.
- Up to 250 guest email/SMS deliveries.
- Custom message library: host can add up to 50 custom messages to the random pool.
- Priority server processing for the IG share renders.

**Pro Host ($9.99/month or $79/year, auto-renewable subscription, year 2 only, skip at launch):**
- 1 Event Pass Plus included per month, rolls over up to 3 unused.
- Saved branding presets (logos, color sets).
- Recurring event templates.
- Discounted overage pricing on additional events ($29 instead of $39).
- Pro badge on the public IG share.

### 6.2 What's IAP, what's web-only, what's both

| Product | iOS IAP | Play Billing | Web (Stripe) |
|---|---|---|---|
| Strip Unlock ($1.99) | Yes | Yes | No (not worth the friction) |
| Event Pass ($14.99 / $12.99) | Yes | Yes | Yes |
| Event Pass Plus ($39 / $34) | Yes | Yes | Yes |
| Pro Host (year 2) | Yes | Yes | Yes |
| Enterprise / white-label deals | No | No | Yes (manual invoicing) |

### 6.3 Estimated unit economics

**Cost-to-serve a free TinyBooth user (no event):**
- Storage: $0 (photos go to Camera Roll, no cloud).
- Compute: $0 (all processing is on-device).
- Bandwidth: ~$0 (only app updates, which Apple/Google host).
- Random messages library: bundled in app, no API call.
- **Total: ~$0/month.** Effectively free to operate at any scale.

**Cost-to-serve a free TinyWall room (host using the free TinyWall tier):**
- 25 guests x ~5 photos x 2 MB = 250 MB.
- S3 storage 7 days = 250 MB x $0.023/GB/month x (7/30) = **~$0.001**.
- CloudFront bandwidth out (each photo viewed maybe 3x): 750 MB out x $0.085/GB = **~$0.06**.
- TinyWall rendering: serverless / Vercel free tier easily handles this.
- **Total: ~$0.06 per free TinyWall room.** Totally absorbable as a customer-acquisition cost.

**Cost-to-serve a paid Event Pass (150 guests, 60-day retention):**
- 150 guests x 10 photos x 2 MB = 3 GB total storage.
- S3: 3 GB x $0.023 x 2 months = **$0.14**.
- CloudFront: assume each photo viewed 5x average (at the event, on the wall, downloaded by host) = 15 GB out x $0.085 = **$1.28**.
- Twilio SMS: 50 messages x $0.0083 = **$0.42**.
- SES email: 50 messages x $0.0001 = **$0.005**.
- IG-format render compute: serverless, ~$0.05 for 1500 photos.
- TinyBooth printer/AirPrint: $0 (host's printer).
- **Total: ~$1.90 per Event Pass.**

**Net per Event Pass after fees:**
- IAP at 15% Small Business rate: $14.99 - $2.25 (Apple) - $0.15 (RevenueCat 1%) = **$12.59 gross margin contribution**, $10.69 net of cloud cost. **~71% net margin.**
- Web Stripe at $12.99: $12.99 - $0.68 (Stripe) = **$12.31**, $10.41 net of cloud cost. **~80% net margin.**

**Net per Event Pass Plus (250 emails, unlimited guests, 90-day retention, assume 300 guests x 12 photos):**
- Storage: 7.2 GB x $0.023 x 3 months = **$0.50**.
- Bandwidth: 36 GB x $0.085 = **$3.06**.
- SMS: 250 x $0.0083 = **$2.08**.
- **Total cloud cost: ~$5.65 per Event Pass Plus.**
- Net at IAP 15%: $39 - $5.85 - $0.39 = **$32.76**, $27.11 net of cloud. **~70% net margin.**

**Break-even math:**
- You need ~3 Event Pass purchases to cover one month of $50/month AWS baseline (free tier + small instance for the dashboard backend).
- At 50,000 MAU and 2% conversion = 1,000 buyers/year. At average $13 net per sale = **$13,000/year revenue** before reaching for Pro Host or Event Pass Plus upsells.
- At 6% conversion (top quartile) = $39,000/year.

### 6.4 Why this plan

1. **Free tier is the same product the existing iOS app already is**, plus more layouts and a tiny watermark. Existing users do not feel betrayed; they get more, not less.
2. **Paid tier is "I'm hosting a thing"**, which is the only moment a user has both intent and budget. Wedding hosts will not bat an eye at $15 when they're spending $40K on the wedding.
3. **No subscription pressure on day one.** Solo dev can ship faster, support fewer edge cases, and learn from real purchase data before adding recurring billing.
4. **Hybrid IAP + web** captures the "I want to save money" segment via the website without giving Apple a reason to reject the app. Anti-steering is the third rail; we sit on the safe side of it inside the iOS app for now.
5. **Cloud costs are aligned with revenue.** Free users cost ~$0. Paid events cost ~$2-6 and earn ~$10-30 net. You can grow without it ever flipping upside down.

---

## 7. Compliance Gotchas (Specific Citations)

### 7.1 Watermark removal must be IAP

> "If you want to unlock features or functionality within your app… you must use in-app purchase. Apps may not use their own mechanisms to unlock content or functionality."

[App Review Guidelines 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase). Do **not** sell watermark removal on the web and unlock it in the iOS app via account state. That gets the app rejected.

**The acceptable pattern:** sell watermark removal as part of the Event Pass IAP. The dashboard, custom branding, retention, and bulk export are bundled into the same purchase. If a user buys Event Pass on the web and then logs into the iOS app, they get all the features **except** in-app watermark removal can only be unlocked by an IAP. To handle this without weird UX, **bundle a "Strip Unlock pack" with web purchases too** so the user buys the Event Pass on the web, the host's iOS app receives an unlock token via your backend, and the in-app watermark is removed via the unlocked entitlement that came with the Event Pass purchase. The technicality: this entitlement is associated with the host's account, not unlocked by an in-app license key, which is what Apple cares about.

Honestly, the cleanest read of 3.1.1 says: **don't try to sell the iOS-app watermark removal anywhere except IAP.** If a host buys the Event Pass on the web, the watermark on strips taken at the event still gets removed because the strip is generated server-side or is tied to event branding (the watermark removal is a property of the *event*, not of the *app*). Document this carefully in your app review notes when submitting.

### 7.2 Account deletion required

If TinyBooth supports account creation (it does, for hosts), the app must let users delete their account from inside the app. This has been mandatory since June 30, 2022. ([Apple developer support](https://developer.apple.com/support/offering-account-deletion-in-your-app/))

Implementation: account screen → "Delete account" button → confirmation modal → backend job that deletes user + their events + their photos within 30 days (GDPR/CCPA timeline).

### 7.3 Sign In with Apple required if other social logins exist

If you offer Google Sign-In or Facebook, you must offer Sign In with Apple as an equally-prominent option. ([Guideline 4.8](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple))

Email magic link only (Supabase Auth setup) avoids this requirement. If you ever add Google login, add Apple at the same time.

### 7.4 Restore Purchases is mandatory

> "Restore feature must be implemented for non-consumable purchases and auto-renewable subscriptions."

[Guideline 3.1.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)

The Event Pass is a consumable so it doesn't strictly need a restore button, but the Pro Host subscription does. RevenueCat's `restorePurchases()` method handles this in one call.

### 7.5 Family Sharing only works with non-consumables and subscriptions

Event Pass is a consumable, so it cannot be shared via Family Sharing. That's fine; one host buys, that host runs the event. Pro Host (subscription) **can** be Family Shared if you toggle it on in App Store Connect. Decide whether you want a single $9.99/month subscription to cover up to 6 family members. Probably yes for goodwill and competitive positioning. ([Family Sharing for IAP](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases/))

### 7.6 Anti-steering outside the US

Inside any non-US storefront iOS app: do not show external payment links without the proper entitlement, do not mention external prices, do not direct users to the website for cheaper deals. Apple still rejects apps for this everywhere outside the US. ([SCiDA DMA analysis](https://scidaproject.com/2025/05/28/apples-anti-steering-aches-key-takeaways-from-the-first-dma-non-compliance-decision/))

In the EU specifically you can use the External Purchase Link Entitlement but it requires an interstitial sheet, location restrictions, and Apple's 17-27% commission. Not worth integrating until you have material EU revenue.

### 7.7 Privacy / data labels

Both stores require accurate privacy labels in App Store Connect and Play Console. TinyBooth collects:
- Photos (when associated with an event, uploaded to S3; when not, never leaves device).
- Email/phone (only when guest opts in to email/SMS delivery, deleted after delivery confirmation).
- Account info (host email, name).

Label these accurately. Lying on privacy labels is a known fast track to enforcement action.

### 7.8 "No app required" for guests is a feature, not a workaround

TinyWall guests upload via a web page (wall.tinybooth.com/event/xyz). They never download an app, never see Apple's payment system, never see an account flow. This is fully outside Apple's jurisdiction because it happens entirely on the web. **Document this clearly in your reviewer notes** to head off any "your guests aren't using IAP" confusion. The host paid via IAP; the guests are end-recipients of the service the host purchased.

### 7.9 The 1M-USD threshold for Small Business / lower fees

You qualify automatically as a new developer. Track your annual proceeds; if you cross $1M in a year (good problem to have), the rate jumps from 15% to 30% for the rest of that year. Plan cash flow accordingly. ([Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/))

---

## 8. Open Questions for Camrynn

1. **Event Pass pricing point: $14.99 or $9.99?** $14.99 sits between POV ($5) and Lense ($35) and feels like a wedding-grade product. $9.99 would maximize conversion volume but signals "cheap utility" rather than "event service." Default to $14.99.
2. **Should the iOS app show a "buy on web for $12.99" button on the US storefront?** Legally allowed post-May 2025. Practically: adds support load and risks looking spammy. Default to no for v1, revisit at month 6 with data.
3. **Strip Unlock at $1.99: keep or cut?** It's a useful safety valve for users who want a clean strip but aren't hosting an event. It also potentially trains users to expect cheap unlocks. Default to ship it; pull it if data shows it's cannibalizing Event Pass.
4. **Pro Host subscription year 2: confirm the deferral.** Subscriptions add real complexity (renewal handling, grace periods, billing retry, Family Sharing). Worth waiting until you have repeat-host data to validate the price point and bundled-event count.
5. **Email/SMS delivery cost passthrough.** At Event Pass tier, 50 deliveries cost ~$0.42. At Plus tier, 250 deliveries cost ~$2.08. Both well within the price. If hosts hit the cap they're stuck; consider an overage rate ($0.10/SMS) sold as a one-off IAP.

---

## Sources

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Apple developer news: external link guideline update May 2025](https://developer.apple.com/news/?id=3ozbk628)
- [Apple Reader app distribution](https://developer.apple.com/support/reader-apps/)
- [Apple Family Sharing IAP setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases/)
- [Apple offering account deletion in your app](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [Google Play User Choice Billing](https://support.google.com/googleplay/android-developer/answer/13821247)
- [Google Play service fees](https://support.google.com/googleplay/android-developer/answer/112622)
- [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)
- [RevenueCat pricing](https://www.revenuecat.com/pricing/)
- [RevenueCat: Anti-steering ruling explained](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy/)
- [RevenueCat: App-to-web purchase guide](https://www.revenuecat.com/blog/engineering/app-to-web-purchase-guidelines/)
- [RevenueCat: Why RevenueCat](https://www.revenuecat.com/why-revenuecat)
- [Stripe: Accept in-app purchases on iOS and Android](https://docs.stripe.com/mobile/digital-goods)
- [Stripe blog: Building for the next wave of app monetization](https://stripe.com/blog/building-for-the-next-wave-of-app-monetization)
- [POV Camera pricing](https://pov.camera/pricing)
- [Lense pricing](https://lense.app/pricing)
- [Veri vs WedSocial discussion](https://www.weddingwire.com/wedding-forums/veri-app-vs-wws-wedsocial-app/663e5f1f569431a1.html)
- [Puddles: 2025 Photo Booth Rental Costs](https://www.puddlesphotobooth.com/2025-photo-booth-rental-costs)
- [Marky 2025 Wedding Photo Booth pricing](https://www.markybooth.com/how-much-does-a-photo-booth-cost-for-a-wedding/)
- [Lenny's Newsletter: Free-to-paid conversion](https://www.lennysnewsletter.com/p/what-is-a-good-free-to-paid-conversion)
- [Geneo: Freemium conversion benchmarks](https://geneo.app/query-reports/freemium-conversion-rate-benchmarks)
- [Qonversion: One-time vs subscription](https://qonversion.io/blog/one-time-payment-or-subscription)
- [Adapty: New US ruling on external iOS payments](https://adapty.io/blog/new-us-ruling-on-external-ios-payments/)
- [MacRumors: Anti-steering injunction violation April 2025](https://www.macrumors.com/2025/04/30/apple-app-store-anti-steering-injunction-violation/)
- [MacRumors: Apple wins ability to charge fees December 2025](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/)
- [9to5Mac: Apple updates guidelines for external links](https://9to5mac.com/2025/05/01/apple-app-store-guidelines-external-links/)
- [The Swift Kit: StoreKit 2 vs RevenueCat](https://theswiftk.it.com/blog/storekit-2-vs-revenuecat-ios-subscriptions)
- [MetaCTO: RevenueCat pricing breakdown](https://www.metacto.com/blogs/the-real-cost-of-revenuecat-what-app-publishers-need-to-know)
- [SCiDA: Apple DMA non-compliance decision](https://scidaproject.com/2025/05/28/apples-anti-steering-aches-key-takeaways-from-the-first-dma-non-compliance-decision/)
- [Neon Commerce: Google Play US billing changes](https://www.neonpay.com/blog/google-plays-new-u.s.-billing-linking-policies-what-game-developers-need-to-know)
- [Mobile App Monetization 2025 strategies](https://www.alimertgulec.com/en/blog/mobile-app-monetization-strategies-2025)
