# Iteration Research: April 2026

Last updated: 2026-04-26
Purpose: Re-benchmark photobooth-app and party-photo-wall competitors plus
Apple/Google policy changes since the original Phase research dated 2026-04-26.
Scope: highlight only material shifts that should change the plan. Ignore noise.

---

## 1. Material shifts that change the plan

This is the TL;DR. Each item links to the supporting evidence below.

1. **Apple Guideline 5.1.2(i) (Nov 13, 2025) now requires explicit consent
   before sharing personal data with any third-party AI.** TinyBooth ships no
   AI features today, so the rule does not block submission. Action: add a
   one-line note to `docs/launch-checklist.md` and `docs/privacy-labels.md`
   declaring "no third-party AI data sharing" so the App Review questionnaire
   answer is locked in. ([TechCrunch coverage](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai/))
2. **Apple's April 2026 enforcement against Cal AI confirms aggressive
   policing of paywall design.** Apple cited four specific patterns: weekly
   pricing shown more prominently than billed price, free-trial toggle that
   hides auto-renewal, multiple sequential purchase prompts, and external
   payment shown bigger than IAP. Our Strip Unlock paywall and Event Pass
   paywall must show the actual amount billed (not a per-day equivalent),
   keep auto-renewal language explicit (none here, since we ship consumables
   only), and avoid retry prompts after a user declines. Action: audit
   `apps/mobile/app/(camera)/paywall.tsx` and `strip-unlock.tsx` against
   these four patterns. ([MacRumors: Cal AI removal](https://www.macrumors.com/2026/04/21/apple-cal-ai-app-store-removal/))
3. **Kululu's free tier has expanded to 500 photos per event** (was 50 per
   the original research). Our Free TinyWall plan at 100 uploads no longer
   "crushes" Kululu; it is now the conservative end of the band. Action:
   either bump Free TinyWall to 250 uploads (still cheaper than 500 to host)
   or keep 100 and lean on the no-app guest flow as the wedge. Recommend
   keeping 100 because retention plus storage cost scale linearly. Document
   the rationale in the plan so it is a deliberate decision, not an oversight.
   ([Knipsmig Kululu alternative](https://knipsmig.com/alternatives/kululu),
   [Easy Wedding Album comparison](https://easyweddingalbum.com/blog/wedding-photo-sharing-comparison))
4. **JoinMyMoment is the new low-price wedge: $19.99 one-time for 100
   guests.** That is below our Event Pass at $14.99 + per-guest cap of 150.
   Their pitch: real-time photos and videos, Google Photos auto-sync, no
   downloads, voice messages. Action: add `joinmymoment.com` to the
   competitor comparison blog post and update `docs/research/competitors.md`
   in the next research pass. They do not have an iPad photobooth piece, so
   the cross-product moat still holds. Do not lower price; instead
   double-down on the booth + wall bundle in marketing copy.
   ([JoinMyMoment 2026 review](https://blog.joinmymoment.com/the-best-wedding-photo-app-of-2026-why-joinmymoment-wins-by-a-mile/),
   [Pricing comparison](https://blog.joinmymoment.com/12-best-wedding-photo-sharing-apps-to-collect-guest-photos-2026/))
5. **Pocketbooth shipped a v4.8 redesign in March 2025 and is getting
   review-bombed by long-time users for "killing the nostalgic experience".**
   Confirms the existing-user backlash thesis in `docs/plan.md` section 5.1.
   Action: keep the "still free, still no account, still your random
   messages" message in the What's New modal. ([Pocketbooth App Store listing](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330))
6. **Pocketbooth subscription weekly is now $4.99, monthly is $19.99 OR
   $39.99 (two tiers), yearly $99.99.** Plus four one-time packs at
   $0.99-$4.99. This is a more aggressive subscription push than the
   original research noted. Confirms that non-subscription positioning is
   the right competitive lane for TinyBooth at launch. No plan change.
   ([Pocketbooth App Store listing](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330))
7. **Simple Booth added per-tier AI credit allocations in 2026** (Core 50,
   Plus 100, Pro 150, Select 200) on top of the $0.10/credit rate. They are
   pushing AI as the upsell. We deliberately ship no AI in v1. Note this in
   `docs/followups.md` as a year-2 evaluation item, not a launch item.
   ([Simple Booth Plans](https://www.simplebooth.com/plans))
8. **POV Camera kept the same pricing structure** (free up to 10 guests,
   $4.99 for 25, scaling up). Lense kept $34.99 flat. No action.
   ([POV pricing](https://pov.camera/pricing))
9. **AI photo booth and 360 video booth are the dominant 2026 trends in the
   pro/event vendor space** but the DIY-host market is unaffected. Year-2
   evaluation item only. ([2026 photo booth trends](https://socialwalls.com/blog/digital-photo-booth-trends/),
   [Studio Z trend list](https://www.studiozphotobooths.com/blog/top-10-photo-booth-trends-for-2025-whats-next-in-event-experiences))
10. **App Store rejection rate climbed in 2026 to ~25% of submissions** (per
    nextnative coverage) with the top 3 unchanged: app crashes (Guideline
    2.1), misleading metadata (2.3), and IAP issues (3.1.1). Mitigation
    already in place via `docs/launch-checklist.md`. No plan change.
    ([NextNative rejection guide](https://nextnative.dev/blog/app-store-review-guidelines))
11. **China App Store cut commission to 25% / 12% (Small Business) on
    March 15, 2026.** TinyBooth does not ship in China at launch. No action.
    ([Apple China announcement](https://developer.apple.com/news/?id=dadukodv))
12. **The Ninth Circuit's December 11, 2025 ruling lets Apple charge SOME
    fee on US external-purchase links (rate TBD pending Supreme Court).**
    Plan already keeps anti-steering buttons OUT of the iOS app at launch
    per `docs/plan.md`. No action; revisit after the Supreme Court ruling.
    ([MacRumors Dec 2025](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/))

---

## 2. Pricing snapshot (April 2026)

Updated table for the wedding/party photo wall category. Where original
research had a number, "→ NEW" calls it out.

| Product | Free tier | Paid (per event) | Notes |
|---|---|---|---|
| **TinyBooth (us)** | Standalone unlimited; TinyWall room 100 uploads, 7-day | $14.99 IAP / $12.99 web Event Pass; $39 IAP / $34 web Plus | Booth + wall bundle is the unique angle |
| **Kululu** | "Limited uploads"; sources cap at 500 photos per event → NEW (was 50) | $39 standard, $99 Pro | Bumped free tier 10x in past year |
| **Wedibox** | Free trial only | $59 standard, up to $119 premium ($89 with 5-year storage, 12-month uploads, RSVP) | Lifetime access on paid; no subscription |
| **GuestPix** | Restricted basic plan | $49 wedding tier; $89 EUR Firma plan; $177 full features | 3-month upload window standard |
| **POV Camera** | 10 guests | $4.99 (25 guests), $34-$50 (250+) | Disposable-camera framing, no live wall on cheap plans |
| **Lense** | 7 guests | $34.99 flat unlimited | Optional video add-on |
| **JoinMyMoment** | None mentioned → NEW ENTRANT vs original research | $19.99 one-time for 100 guests | Browser-based, real-time, Google Photos sync, voice msg |
| **EasyWeddingAlbum** | None | $29 one-time → NEW ENTRANT | 12-month storage, AI photo organization |
| **Joy** | Free wedding website + photo sharing | Free; upgrades for custom domain/SMS | Guests need the Joy app for uploads |

| Photobooth app | Free tier | Paid | Notes |
|---|---|---|---|
| **TinyBooth (us)** | Full app, layouts, messages, AirPrint | $14.99 IAP Event Pass; $39 Plus; $1.99 Strip Unlock | No subscription at launch |
| **Pocketbooth** | Free with subscription paywall | $0.99 base; $4.99/wk, $19.99/mo OR $39.99/mo, $99.99/yr; packs $0.99-$4.99 | March 2025 redesign caused review backlash |
| **Simple Booth HALO** | 25 AI credits trial | $9-$249/wk or $29-$249/mo across 5 tiers + AI credits at $0.10 ea | Pro tool for vendors |
| **LumaBooth** | None | $18-$20/mo, 2 devices included | iPad/iPhone/Mac, dslrBooth-owned |
| **dslrBooth (Windows)** | None | $17/mo annual, $49/mo monthly | Windows only |

---

## 3. App Store + Play Store policy changes (Nov 2025 - Apr 2026)

### Apple

- **Guideline 5.1.2(i), Nov 13, 2025: third-party AI data sharing.** Apps
  must "clearly disclose where personal data will be shared with third
  parties, including with third-party AI, and obtain explicit permission."
  Source: [Apple developer news](https://developer.apple.com/news/?id=9txfddzf),
  [TechCrunch](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai/).
  TinyBooth has no AI integration at launch, so disclose "no third-party AI"
  in the privacy questionnaire. Add a release-time check to the launch
  checklist.
- **Guideline 2.5.2 enforcement, March 2026.** Apple blocked Replit and
  Vibecode updates citing dynamic-code-execution rules. Indie note: anything
  that downloads JS at runtime and changes app behavior is at risk. EAS
  Update is sanctioned because it is Expo's blessed delivery channel; native
  changes still require a binary. Plan note: keep `eas update` runtime
  changes UI/copy only, never logic that bypasses native gates.
  ([Adalo coverage](https://www.adalo.com/posts/apple-app-store-vibe-coding-guideline-2-5-2/))
- **Cal AI removal, April 21, 2026.** Apple cited Cal AI for: (a) showing
  weekly calculated pricing more prominently than the billed amount, (b) a
  free-trial toggle that hid auto-renewal, (c) sequential purchase prompts
  after a decline, and (d) external payment shown larger than IAP. Plan
  already avoids (b) and (d) (consumables only, no anti-steering). Confirm
  (a) and (c). ([MacRumors Cal AI](https://www.macrumors.com/2026/04/21/apple-cal-ai-app-store-removal/))
- **Anti-steering ruling status (Apr 2026).** US storefront still allows
  external-purchase links without entitlement. Ninth Circuit Dec 2025 ruling
  permits Apple to charge "some" fee, exact rate pending Supreme Court. Plan
  decision (no in-app external link at launch) remains correct.
  ([MacRumors Dec 2025](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/),
  [AppleInsider Mar 2026](https://appleinsider.com/articles/26/04/06/epic-vs-apple-lawsuit-over-app-store-fees-is-moving-to-the-supreme-court-again))
- **App Store rejection rate.** Apple reviewed ~7.77M submissions and
  rejected ~25% in 2026, per nextnative aggregations. Top 3 root causes
  unchanged from 2025: 2.1 App Completeness, 2.3 Accurate Metadata, 3.1.1
  IAP. Plan covers all three. ([NextNative](https://nextnative.dev/blog/app-store-review-guidelines))
- **Small Business Program: no commission change in US/EU/global.** Still
  15% under $1M. China dropped to 12% Mar 15, 2026 (does not affect us).
  ([Apple SBP](https://developer.apple.com/app-store/small-business-program/),
  [Apple China News](https://developer.apple.com/news/?id=dadukodv))

### Google

- **Play Store: no material change relevant to TinyBooth since the original
  research.** User Choice Billing still rolled out in 9 regions; we skip it
  at launch. Post-Epic v Google US billing rules continue rolling out,
  similar to Apple's US-only carve-out.
  ([Google Play UCB](https://support.google.com/googleplay/android-developer/answer/13821247))

### Privacy manifests

- **No new required-reason API categories since the May 2024 enforcement
  start.** Our `apps/mobile/ios/TinyBooth/PrivacyInfo.xcprivacy` already
  declares UserDefaults, FileTimestamp, DiskSpace, and SystemBootTime with
  the right reason codes. No action.
  ([Apple privacy manifest docs](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files))

---

## 4. New entrants worth tracking

These appeared after the original research date and changed the band:

1. **JoinMyMoment** — $19.99 one-time, 100 guests, Google Photos auto-sync.
   Closest direct competitor in price. URL: [joinmymoment.com](https://joinmymoment.com/).
2. **EasyWeddingAlbum** — $29 one-time, 12-month storage, AI photo
   organization. URL: [easyweddingalbum.com](https://easyweddingalbum.com/).
3. **Guestlense** — appears in 2026 comparison posts as a Wedibox
   alternative. URL: [guestlense.com](https://www.guestlense.com/).
4. **Dreamwave AI Photo Booth** — pro AI-generation booth aimed at
   corporate, US-based servers. Not a TinyBooth competitor today (different
   buyer) but indicates AI is the pro-side moat for incumbents.
5. **Simple Booth's "Custom AI Effects"** in the Plus tier and above (2026
   release). Confirms AI as a paid upsell vector for the pro segment.

---

## 5. App-store rejection patterns from the past 6 months

Aggregated from twinr.dev, nextnative, eitbiz, capgo, and the Apple
developer forums. Reddit's r/iOSProgramming traffic is captured indirectly
through forge and decode posts; direct site:reddit.com queries return
secondary aggregator posts rather than primary threads, so cite the
aggregators below.

Top patterns relevant to TinyBooth:

1. **Paywall pricing must display the billed amount more prominently than
   any per-day equivalent.** Cal AI (Apr 2026). Mitigation: paywall already
   shows `$N.99` not `$N/day`. Confirm in the audit.
2. **Restore Purchases must be reachable from the paywall AND from
   settings.** capgo guide. Mitigation: RevenueCat exposes
   `restorePurchases()`; verify the button is visible in both places.
3. **Account deletion must be reachable in the app, not behind a web link.**
   Required since June 2022, still a top rejection. Mitigation: implemented
   in `apps/mobile/app/(tabs)/settings.tsx`.
4. **Sandbox IAP must succeed during Apple Review.** Apple's reviewer test
   account fails roughly 10% of the time; provide explicit reviewer
   instructions calling out the sandbox flow.
5. **Privacy manifest must be valid plist** (Bitrise notes that some apps
   ship with malformed XML). Already validated as part of build.
6. **Metadata must match the build** (2.3.1). The screenshots and
   description must reflect the actual launch UI. Mitigation: Fastlane
   `screenshots` lane regenerates from the live app.
7. **Apps using webview wrappers fail 4.2.** Not applicable — TinyBooth is
   native via Expo.

---

## 6. Concrete plan-deltas to apply this iteration

Items numbered below get fixed in this iteration where they fit in <30
minutes; the rest go to `docs/followups.md`.

| # | Delta | Where | Action this pass |
|---|---|---|---|
| 1 | Note "no third-party AI" in launch checklist + privacy labels | `docs/launch-checklist.md`, `docs/privacy-labels.md` | Fix now |
| 2 | Audit Cal-AI-style paywall traps in mobile paywall | `apps/mobile/app/(camera)/paywall.tsx`, `strip-unlock.tsx` | Audit now (Part 2) |
| 3 | Document Free TinyWall = 100 uploads is intentional vs Kululu's new 500 | `docs/plan.md` section 2 free tier limits | Fix now |
| 4 | Add JoinMyMoment to the competitor comparison blog post | `apps/web/content/blog/wedding-photo-wall-app-comparison-tinybooth-vs-pov-vs-kululu.tsx` | Fix now |
| 5 | Add to followups: re-evaluate AI features in year 2 | `docs/followups.md` | Add now |
| 6 | Add to followups: re-evaluate anti-steering buttons after SCOTUS | `docs/followups.md` | Add now |
| 7 | Add to followups: 360 video booth + AI portrait as year-2 paid features | `docs/followups.md` | Add now |
| 8 | Update `docs/research/competitors.md` with Kululu 500-photo number, JoinMyMoment, EasyWeddingAlbum | `docs/research/competitors.md` | Add now |
| 9 | Document EAS Update boundary (UI/copy only, never logic that bypasses native gates) | `docs/launch-checklist.md` | Fix now |

---

## 7. Sources

### Apple policy

- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple developer news: updated guidelines (Nov 2025)](https://developer.apple.com/news/?id=9txfddzf)
- [TechCrunch: Apple's new App Review Guidelines clamp down on third-party AI data sharing](https://techcrunch.com/2025/11/13/apples-new-app-review-guidelines-clamp-down-on-apps-sharing-personal-data-with-third-party-ai/)
- [MacRumors: Apple pulled Cal AI for deceptive billing design (Apr 21, 2026)](https://www.macrumors.com/2026/04/21/apple-cal-ai-app-store-removal/)
- [TechCrunch: Apple's Cal AI crackdown signals it's still policing the App Store](https://techcrunch.com/2026/04/21/apples-cal-ai-crackdown-signals-its-still-policing-the-app-store/)
- [Adalo: Apple tightens App Store rules for AI-built apps (Guideline 2.5.2)](https://www.adalo.com/posts/apple-app-store-vibe-coding-guideline-2-5-2/)
- [MacRumors: Ninth Circuit Dec 2025 ruling on external links](https://www.macrumors.com/2025/12/11/apple-app-store-fees-external-payment-links/)
- [AppleInsider: Epic v Apple heading to Supreme Court (Apr 2026)](https://appleinsider.com/articles/26/04/06/epic-vs-apple-lawsuit-over-app-store-fees-is-moving-to-the-supreme-court-again)
- [Apple App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- [Apple China commission cut (Mar 15, 2026)](https://developer.apple.com/news/?id=dadukodv)

### Rejection patterns

- [NextNative: App Store Review Guidelines (2025) checklist + top rejection reasons](https://nextnative.dev/blog/app-store-review-guidelines)
- [twinr: Apple App Store rejection reasons in 2025](https://twinr.dev/blogs/apple-app-store-rejection-reasons-2025/)
- [eitbiz: Top reasons iOS apps get rejected in 2026](https://www.eitbiz.com/blog/top-reasons-ios-apps-get-rejected-by-the-app-store-and-fixes/)
- [capgo: How to pass App Store review for IAP in 2025](https://capgo.app/blog/how-to-pass-app-store-review-iap/)
- [forge: Top 10 App Store rejection reasons in 2026](https://forgeasc.com/blog/app-store-rejection-reasons)

### Competitor pricing

- [Pocketbooth Photo Booth (App Store)](https://apps.apple.com/us/app/pocketbooth-photo-booth/id385145330)
- [Simple Booth Plans](https://www.simplebooth.com/plans)
- [LumaBooth pricing FAQ](https://support.lumasoft.co/en/articles/12831788-app-pricing-and-features-frequently-asked-questions)
- [dslrBooth pricing](https://dslrbooth.com/pricing)
- [POV Camera pricing calculator](https://pov.camera/pricing)
- [Kululu alternatives roundup (knipsmig)](https://knipsmig.com/alternatives/kululu)
- [Wedibox pricing](https://www.wedibox.com/pricing)
- [GuestPix wedding pricing](https://guestpix.com/weddings-pricing/)
- [Easy Wedding Album: Kululu vs Wedibox vs Guestpix 2026](https://easyweddingalbum.com/blog/wedding-photo-sharing-comparison)
- [JoinMyMoment: Best wedding photo app of 2026](https://blog.joinmymoment.com/the-best-wedding-photo-app-of-2026-why-joinmymoment-wins-by-a-mile/)
- [JoinMyMoment: 12 best wedding photo sharing apps 2026](https://blog.joinmymoment.com/12-best-wedding-photo-sharing-apps-to-collect-guest-photos-2026/)
- [Joy wedding app pricing](https://withjoy.com/pricing/)

### Trends

- [SocialWalls: Top digital photo booth trends 2026](https://socialwalls.com/blog/digital-photo-booth-trends/)
- [Studio Z: Top 10 photo booth trends 2026](https://www.studiozphotobooths.com/blog/top-10-photo-booth-trends-for-2025-whats-next-in-event-experiences)
- [Mdrn: 2026 the year of AI booths that transform](https://www.mdrnphotoboothcompany.com/blog/2026-the-year-of-ai-booths-that-transform)

### Privacy manifests

- [Apple Privacy manifest documentation](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- [Bitrise: Enforcement of Apple Privacy Manifest from May 1, 2024](https://bitrise.io/blog/post/enforcement-of-apple-privacy-manifest-starting-from-may-1-2024)
