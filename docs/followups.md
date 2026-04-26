# Followups

Items deferred from the April 2026 iteration pass. Each is bigger than
~1 commit, or needs design decisions, or is a year-2 evaluation. Keep
this short. When an item ships, delete it; do not leave a long history.

Last updated: 2026-04-26.

---

## From the iteration research (`docs/research/iteration-2026-04.md`)

- **AI features evaluation (year 2).** Simple Booth, dslrBooth, and
  Dreamwave AI are pushing AI portraits and AI background swap as the
  main upsell. We deliberately ship zero AI in v1. Re-evaluate at month
  6 with conversion data: if Event Pass conversion is below 2%,
  prototype an "AI portrait" add-on as a new IAP product. Compliance
  prerequisite: ship an explicit consent UI per Apple Guideline
  5.1.2(i) before sending any photo to a third-party AI.
- **Anti-steering buttons after Supreme Court ruling.** Plan currently
  keeps external "buy on web" buttons OUT of the iOS app. Revisit when
  the SCOTUS ruling on Epic v Apple lands (estimated 2027). The 5-10%
  margin gain is real but the support-load and review-rejection risk
  needs the legal dust to settle.
- **360 video booth + AI portrait as year-2 paid features.** Pro-side
  competitors are building toward this. Out of scope for v1; track for
  the year-2 product roadmap.
- **TinyWall free cap re-evaluation.** Kululu's 500-photo free tier in
  2026 raises the question of whether 100 uploads is too low. Decision
  rationale documented in `docs/plan.md` section 2: cost-linear, bundle
  is the wedge. Revisit at month 6 if guests-hitting-cap conversion is
  worse than expected.

## From the audit (`docs/audit-2026-04.md`)

- **Photo AI moderation opt-in (`users.md` #11).** Caption profanity
  filter exists. Photo nudity / inappropriate-image moderation is not
  implemented. Sell as a paid add-on toggle at the host level,
  Cloudflare-Workers AI or AWS Rekognition behind it. ~3 days of work
  including the Settings UI, the moderation queue, and the cost model.
- **Guest upload reminder push (`users.md` #13).** Send a single SMS
  or web push 24 to 48 hours after the event to guests who haven't
  uploaded. Low-cost feature with high perceived value. Needs an event
  closure cron and a guest contact list (we already capture phones for
  delivery opt-in). ~2 days.
- **Sentry + PostHog wiring on mobile and web.** Tracked in launch
  checklist. Privacy manifest already declares the data types.
- **Server-side Sign in with Apple token revoke endpoint.** Tracked in
  `docs/launch-checklist.md` section 5; the SDK call is in place
  client-side, the server-side revoke is the missing piece.
- **Apple server-to-server notifications endpoint.** Same source.
- **Fastlane Screengrab lane for Android screenshots.** Same source.
- **Skia bridge real implementation.** `apps/mobile/src/lib/skiaBridge.ts`
  ships a placeholder that throws. Real wiring lands once `expo prebuild`
  runs against a development client. A server-side Sharp fallback could
  unblock the dev/preview path in the meantime; out of scope for the
  unattended pass because passing photo URLs to a `/api/strip/render`
  endpoint is a sizeable change.
- **Supabase `auth.users -> public.User` mirror trigger in production.**
  Tracked in `docs/launch-checklist.md` section 1 (Supabase). Dev mode
  now has a tRPC-side `userMirrorMiddleware` upsert as a guard, but a
  real DB trigger is the long-term answer.

## Open questions stuck behind Camrynn

These do not need code changes; they need a decision before launch.
Listed in `docs/plan.md` section 8 already; restated here so they do not
get lost between docs.

1. Pricing validation ($14.99 / $39 launch).
2. Apple developer account ownership (`codesquad`).
3. Stripe account creation.
4. AWS account specifics for Terraform.
5. Brand refresh (pick one of three logo directions).
6. Standalone watermark question (grandfather vs. day-one).
7. TinyWall free tier guest cap (100 vs. 250) given Kululu's 2026 bump.
8. GoDaddy -> Cloudflare DNS migration window.

---

How to use this doc:

- One bullet per item. If it grows past two sentences, move it to its
  own doc and link from here.
- When an item ships, delete the bullet. Do not add a "shipped" history
  list.
- Anything bigger than ~3 days of work should also have a real ticket
  in whatever issue tracker we end up using.
