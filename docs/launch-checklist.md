# Launch checklist

Single source of truth for shipping TinyBooth + TinyWall to the App Store
and Play Store. Sections are roughly chronological; check items in the
order they appear unless an obvious dependency forces a swap.

Last updated: 2026-04-26.

How to use this doc: tick the box once the item is done. Most items link
to a more detailed doc or file. If a step turns out to need a different
order, update both this doc and the upstream doc together.

---

## 1. Pre-launch (1 week out)

### Brand + assets

- [ ] Final logo locked in `docs/brand/identity.md`. Pick one of the three
      directions in the brand doc.
- [ ] App icon at 1024x1024 PNG (no alpha) saved at
      `apps/mobile/assets/icon.png`.
- [ ] Adaptive icon (Android) at `apps/mobile/assets/adaptive-icon.png`.
- [ ] Splash screen at `apps/mobile/assets/splash.png`.
- [ ] App Store hero asset (a 1200x630 PNG of the iPad on a stand at an
      event) saved at `docs/brand/assets/store-hero.png`.

### Real screenshots

- [ ] Run `bundle exec fastlane screenshots` and verify the six PNGs land
      in `apps/mobile/fastlane/screenshots/en-US/<device>/`. See
      `apps/mobile/fastlane/README.md`.
- [ ] Run `frameit` (auto-runs as part of the lane) and verify each
      caption is correct.
- [ ] Capture matching Android screenshots per
      `apps/mobile/scripts/capture-android-screenshots.md` until we wire
      Screengrab.
- [ ] Capture or record a 30-second App Preview video (booth ->
      strip -> print -> wall). Apple requires a portrait orientation
      file, max 500MB, H.264.

### Apple Developer + App Store Connect

- [ ] Apple Developer account in good standing under the
      `codesquad` team. Confirm the membership renewal is paid through
      at least the next 12 months.
- [ ] Confirm the App Privacy questionnaire answer for "Third-Party AI"
      is "no". TinyBooth ships zero third-party AI integrations at
      launch (Apple Guideline 5.1.2(i), Nov 13, 2025). If we ever add
      Apple Intelligence, OpenAI, Google Gemini, or any other third-party
      model, update the questionnaire AND add an explicit consent UI
      before sharing data, per
      `docs/research/iteration-2026-04.md` section 3.
- [ ] App Store Connect listing for `com.codesquad.tinybooth` is
      reachable (the existing Swift app's listing). If the bundle ID
      ownership has moved, run an account transfer FIRST.
- [ ] Enroll in the Apple Small Business Program in App Store Connect ->
      Agreements, Tax, and Banking. See `docs/iap-setup.md` section 1.2.
- [ ] Create the three IAP products (`strip_unlock`, `event_pass`,
      `event_pass_plus`) per `docs/iap-setup.md` section 1.3.
- [ ] Fill in the App Privacy questionnaire from `docs/privacy-labels.md`.
- [ ] Set Age Rating to 4+ (no objectionable content; camera access only).
- [ ] Set Export Compliance to "Does not use encryption beyond standard
      iOS frameworks" (we have `ITSAppUsesNonExemptEncryption: false` in
      `apps/mobile/app.json` already).

### Google Play Console

- [ ] Play Console account in good standing.
- [ ] Create the three Managed Products per `docs/iap-setup.md` section 2.
- [ ] Fill in the Data Safety form from `docs/privacy-labels.md`.
- [ ] Content Rating questionnaire submitted (PEGI 3 / IARC equivalent).
- [ ] Set up the Internal testing track and add Camrynn + 5 friends.

### RevenueCat

- [ ] Project provisioned per `docs/iap-setup.md` section 3.
- [ ] iOS + Android apps added with their respective service credentials.
- [ ] Webhook configured at
      `https://tinybooth.com/api/webhooks/revenuecat` with
      `REVENUECAT_WEBHOOK_SECRET` set in Vercel.

### Stripe

- [ ] TinyBooth Stripe account created (separate from other projects per
      `PROMPT.md`).
- [ ] Live keys saved to Vercel (`STRIPE_SECRET_KEY`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
      `STRIPE_WEBHOOK_SECRET`).
- [ ] Two products created with Stripe Tax enabled per
      `docs/iap-setup.md` section 4.

### Supabase

- [ ] Production project provisioned (separate from staging).
- [ ] All Vercel envs in `docs/iap-setup.md` section 5.1 set to the
      production URL + service role key.
- [ ] Auth providers enabled: Apple, Google, Magic Link.
- [ ] RLS policies tested via the pgTAP suite.
- [ ] User-delete-mirrors-auth trigger applied (see
      `docs/account-deletion-audit.md` section 6).

### Cloudflare R2

- [ ] Production bucket `tinybooth-events` created.
- [ ] Production access key + secret set in Vercel.
- [ ] Public R2 base set to `https://media.tinybooth.com` (Cloudflare
      Worker proxy if needed).

### DNS + domain

- [ ] `tinybooth.com` migrated from GoDaddy to Cloudflare DNS.
- [ ] Apex points at Vercel via the recommended A/AAAA records.
- [ ] `www.tinybooth.com` 301s to apex.
- [ ] `wall.tinybooth.com` keeps its current Vercel deploy as a 301-only
      project for 12 months per `docs/plan.md` section 2.
- [ ] Email-sending domain configured in SES (DKIM + SPF + DMARC).

### Search Console + Webmaster

- [ ] Google Search Console verified for `tinybooth.com` (DNS TXT
      method).
- [ ] Bing Webmaster Tools verified.
- [ ] Sitemap submitted on both: `https://tinybooth.com/sitemap.xml`.

### Sentry + analytics

- [ ] Sentry production project created. DSN saved as
      `SENTRY_DSN_MOBILE` and `SENTRY_DSN_WEB`.
- [ ] PostHog project created (free cloud or self-hosted).
- [ ] Both wired into the mobile and web apps.
- [ ] Privacy manifest and privacy labels updated to reflect Sentry +
      PostHog data collection.

---

## 2. Submission day

### Mobile build + submit

- [ ] `git status` clean on `main`.
- [ ] Bump `apps/mobile/app.json` version to `1.0.0`.
- [ ] Bump `apps/mobile/app.json` `ios.buildNumber` and
      `android.versionCode`.
- [ ] Tag the release: `git tag mobile-v1.0.0`.
- [ ] Push the tag to trigger `.github/workflows/mobile-build.yml` OR run
      `apps/mobile/scripts/build-and-submit.sh production` locally.
- [ ] Wait for both EAS builds to finish (typically 20 to 40 minutes).
- [ ] On submit success, both stores have a draft sitting in their
      respective consoles.

### App Store Connect: final review prep

- [ ] Push metadata via `bundle exec fastlane metadata_push`.
- [ ] Push screenshots via `bundle exec fastlane screenshots_push`.
- [ ] Verify the App Privacy questionnaire matches
      `docs/privacy-labels.md`.
- [ ] Verify the IAP review screenshots are attached for each of the
      three products.
- [ ] Paste the reviewer notes from
      `docs/account-deletion-audit.md` section 7 into App Store Connect
      -> App Review Information.
- [ ] Test account credentials added to App Review Information (a
      sandbox Apple ID with one Event Pass already purchased so the
      reviewer can verify the watermark removal flow).
- [ ] Submit for Review.

### Play Console: final review prep

- [ ] Upload the Android App Bundle from EAS to the production track.
- [ ] Set rollout to 100% staged release (or 20% for the first 24 hours
      if Camrynn wants to monitor crash rate first).
- [ ] Confirm the Data Safety form, Content Rating, and Target Audience
      sections are all green.
- [ ] Submit for Review.

### Web

- [ ] `tinybooth.com` is live and indexed (the marketing site shipped in
      Phase 5).
- [ ] `tinybooth.com/wall/{slug}` works for at least one real event.
- [ ] `tinybooth.com/dashboard` loads behind Supabase Auth.
- [ ] Stripe Checkout works end-to-end on the dashboard pricing page.

---

## 3. Post-approval

### Day 0 to 1 after approval

- [ ] Receive the Apple "Ready for Sale" email. Hit "Release this
      version" in App Store Connect (we did not auto-release).
- [ ] Receive the Play Console "Approved" email. Promote from internal
      testing to production track.
- [ ] Watch Sentry for crash spikes for 24 hours.
- [ ] Watch the App Store reviews for the first 5 to 10 reviews. Reply
      to anything coherent within 24 hours.
- [ ] Open Search Console and confirm `site:tinybooth.com` shows the
      cornerstone landing pages.

### Week 1

- [ ] Triage every Sentry issue with > 10 occurrences.
- [ ] Reply to every App Store and Play Store review.
- [ ] Watch the Stripe + RevenueCat dashboards. Confirm at least one
      real purchase has flowed through both vendors.
- [ ] Run the bulk-export endpoint against a real event and verify the
      zip downloads.

### Week 2 to 4

- [ ] Publish blog posts 9 and 10 from the SEO content list per
      `docs/research/seo.md`.
- [ ] Reach out to 5 photobooth-rental small businesses with a
      "TinyBooth at your venue" pitch.
- [ ] Review the conversion funnel in PostHog. If Strip Unlock is
      cannibalizing Event Pass at > 30%, raise its price to $2.99.
- [ ] Apple sandbox refund test: confirm RC sends `CANCELLATION`,
      Event reverts to FREE, retention shortens.

---

## 4. Hard rules during launch week

- Do NOT auto-deploy infra changes. `infra-apply.yml` is manual dispatch
  only.
- Do NOT push a real migration. `migration.yml` is manual dispatch only,
  dry-run by default.
- Do NOT amend a commit that has been pushed.
- Do NOT re-enable a banned word ("leverage", "robust", etc) in App
  Store copy or release notes.
- Do NOT ship JS via `eas update` that bypasses native gates (Apple
  Guideline 2.5.2 enforced against Replit/Vibecode in March 2026 per
  `docs/research/iteration-2026-04.md`). Copy and UI-only OTA changes are
  fine; logic that changes paywall behavior or unlocks features without
  a native binary review is not.

---

## 5. After-launch backlog

Items deferred from Phase 6 that are tracked here so they don't get
lost:

- Server-side Sign in with Apple token revoke endpoint (see
  `docs/sign-in-with-apple-checklist.md` section 4).
- Apple server-to-server notifications endpoint at
  `/api/webhooks/apple-notifications`.
- Fastlane Screengrab lane for Android screenshots (see
  `apps/mobile/scripts/capture-android-screenshots.md`).
- Sentry + PostHog wiring on both mobile and web.
- Supabase auth.users -> User mirror trigger in production.
- The "/" wordmark watermark plus IG share watermark assets at print
  resolution and IG square.
