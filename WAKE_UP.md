# WAKE_UP

Hi Camrynn. Read this first when you wake up. You should be able to scan
it in 3 minutes. Anything deeper has a doc link.

Last updated: 2026-04-26 by the overnight verification pass.

---

## What's here

A working TinyBooth + TinyWall rebuild as a Turborepo + pnpm monorepo.
Phases 0 to 6 plus one iteration pass are done. The mobile app is
Expo / React Native (`apps/mobile`). The marketing + dashboard +
APIs live in `apps/web`. The TV display + guest upload pages live in
`apps/wall`. Shared logic lives in `packages/`. Local commits only,
nothing pushed, nothing deployed, no money spent. Full plan in
`docs/plan.md`.

## What works right now

Verified live with curl against `pnpm dev`. Full log:
`docs/e2e-verification-2026-04.md`.

- [x] Marketing: `/`, `/app`, `/wall`, `/pricing`, `/blog`, every blog
      post, `/sitemap.xml`, `/robots.txt`. All return 200 and pass the
      content checks listed in the e2e log.
- [x] Wall happy path end-to-end. Anon `event.create` -> upload a JPEG
      -> `post.create` -> the post is visible at
      `http://localhost:3001/{slug}`.
- [x] Dashboard happy path with the `x-debug-user-id` header. Owned
      `event.create`, `dashboard.events`, paid-tier export to a real
      zip file streamed back from `/uploads/...`.
- [x] `pnpm turbo run lint typecheck test build` is green.
- [x] All 427 tests pass (12 ui-tokens + 6 messages + 7 api-types +
      5 scripts + 28 billing + 20 auth + 42 mobile + 1 wall + 263 web +
      43 strip-render).
- [x] Build green. Web bundle for the homepage is 97 kB first-load JS;
      dashboard pages are around 159 kB.

## What needs you (action items, prioritized)

1. **Decide the 8 open questions in section 8 of `docs/plan.md`** (or
   confirm my recommendations below). All eight are reproduced at the
   bottom of this file. Effort: 30 min over coffee.
2. **Provide credentials when you're ready to deploy.** Four are
   blocked on you: TinyBooth Stripe account, Resend project + API key
   for transactional email, GoDaddy DNS handover for `tinybooth.com`,
   RevenueCat project (after App Store Connect IAPs exist). Sections 1
   and 2 of `docs/launch-checklist.md` have the exact env-var names
   that need filling.
3. **Pick one of the three logo directions** in
   `docs/brand/identity.md` section 2 so we can lock the mark before
   the next App Store submission. My pick was Direction B for the
   web favicon and lockup, with Direction A reserved for the App Store
   icon for continuity. Effort: 10 min.
4. **Sign the IAP setup off** per `docs/iap-setup.md`. The doc has
   the exact App Store Connect + Play Console + RevenueCat steps for
   `strip_unlock`, `event_pass`, `event_pass_plus`. Effort: 60 to 90
   min once accounts are in place.
5. **Optional, Phase 7 candidate**: pick whether we ship the mobile
   `Save frames` button I added in this pass. Code is in
   `apps/mobile/app/(camera)/preview.tsx`. It only renders when there
   is more than one captured frame. Effort to roll back: trivial.

## What to read first

If you have 30 min total:

1. `docs/plan.md` (the call sheet on every product decision).
2. `docs/launch-checklist.md` (sequenced steps to actually ship).
3. `docs/iap-setup.md` (App Store Connect + Play Console + RC + Stripe).
4. `docs/brand/identity.md` (the brand system; section 2 has the three
   logo directions).
5. `docs/e2e-verification-2026-04.md` (proof everything actually works).
6. `docs/audit-2026-04.md` (the full April audit; nothing red).
7. `docs/followups.md` (what's deferred and why).

## The 8 open questions from plan section 8 (with current recommendation)

1. **Pricing validation.** $14.99 Event Pass / $39 Plus / $1.99 Strip
   Unlock. Recommend: ship at these prices. Pocketbooth is $4.99 floor;
   Lense is $34.99 ceiling. We sit in between for the wedding-grade
   end. Adjust in App Store Connect before submission, never after.
2. **Apple developer account ownership.** Bundle ID stays
   `com.codesquad.tinybooth` (it lives on your personal Apple Dev
   account; users never see it). App Store Connect display name and
   developer name will read "TinyBooth". No account transfer needed.
3. **Stripe account for TinyBooth.** Recommend: create a separate
   Stripe account from Bookish before Phase 4 wiring. I won't create
   it; tell me when keys are ready and I'll wire them.
4. **AWS account for Terraform.** Resolved 2026-04-26: NOT NEEDED. Email
   moved to Resend (free tier covers 3k/mo, $20/mo for 50k). Secrets live
   in Vercel + Supabase. Terraform skeleton deleted from `infra/`. No AWS
   account required for launch.
5. **Brand refresh.** Recommend: Direction B for the lockup mark and
   favicon. Direction A as the App Store icon for continuity with
   existing iOS users. See `docs/brand/identity.md` section 2.
6. **Standalone watermark question.** Recommend: grandfather all
   existing iOS users to "no standalone watermark" for 6 months. New
   installs default to "no standalone watermark" with a one-time
   "support TinyBooth" $1.99 Strip Unlock prompt. Maximize-conversion
   alternative: watermark every standalone strip from day one. I'd take
   the goodwill route given the "exactly what I was looking for" reviews
   on the existing Swift app.
7. **TinyWall free tier guest cap.** Recommend: hold at 100 uploads
   even though Kululu went to 500 in 2026. Cost-to-serve scales linearly
   with retained photos and our wedge is the booth+wall bundle plus the
   no-app guest UX, not the biggest free cap. Revisit at month 6.
8. **Domain DNS migration.** Recommend: move `tinybooth.com` from
   GoDaddy to Cloudflare during Phase 5 launch week. Send me GoDaddy
   creds when you're ready and I'll do the apex + `www` records.

## How to run it

The new normal: every infra op goes through `pnpm tinybooth`. See
`packages/cli/README.md` for the full command list, `docs/decisions/0003-single-cli-for-ops.md`
for the why.

```bash
# Bootstrap providers once (interactive, idempotent, dry-runnable):
pnpm tinybooth setup --dry-run     # see what it would do
pnpm tinybooth setup               # actually do it

# Day-to-day:
pnpm tinybooth doctor              # health check
pnpm tinybooth deploy --staging    # preview deploy
pnpm tinybooth deploy              # production deploy
pnpm tinybooth migrate --check     # CI guard for pending migrations
pnpm tinybooth release ios --track=internal
```

To boot the apps locally without the CLI:

```bash
# 1. Install dependencies (already done; safe to re-run).
pnpm install

# 2. Make sure local Postgres is running. The repo reuses the bookish
#    container; create a `tinybooth_dev` database in it once:
docker exec bookish-postgres psql -U bookish \
  -c "CREATE DATABASE tinybooth_dev;"

# 3. Push the Prisma schema to the local DB.
DATABASE_URL=postgres://bookish:bookish_dev_password@localhost:5432/tinybooth_dev \
  pnpm --filter @tinybooth/web exec prisma db push --skip-generate

# 4. Boot both apps. Two terminals.
pnpm --filter @tinybooth/web dev    # http://localhost:3000
pnpm --filter @tinybooth/wall dev   # http://localhost:3001

# 5. Hit these URLs.
#  Marketing: http://localhost:3000/
#  Dashboard (no auth UI yet, dev uses x-debug-user-id header):
#    http://localhost:3000/dashboard
#  Wall TV display: http://localhost:3001/<slug>
#    (create a slug first by POSTing to /api/trpc/event.create)

# 6. Run the full quality bar any time:
pnpm turbo run lint typecheck test build
```

Both `apps/web/.env.local` and `apps/wall/.env.local` are checked in and
contain only the local Postgres URL and the dev base URLs. They have no
secrets. Real prod env values live in Vercel per
`docs/launch-checklist.md` section 1.

## Final test / lint / build status

- `pnpm turbo run lint typecheck test build`: 48/48 green, 17.8s warm.
- 427 tests across the monorepo. All passing.
- Web bundle: homepage 97 kB FLJS, dashboard pages 159 kB. Within the
  Core Web Vitals budget per `docs/research/seo.md`.
- Mobile typecheck green; tests run in vitest because RN runtime is not
  in node. Real device testing is gated on `expo prebuild`.

## What you'll see when you run `pnpm dev` first thing tomorrow

`http://localhost:3000` lands on the brand homepage with Coral primary
CTAs, a working sticky header with the wordmark, and a footer with the
full nav. `http://localhost:3001/<any slug>` shows the TV display for
that event. The dashboard at `/dashboard` shows a friendly skeleton
empty state while it loads, then either the events grid or the
empty-state card with the "Create your first event" CTA. All async
states have a skeleton. All errors have a recovery button. The booth
camera screen forces dark venue mode regardless of OS scheme so the
tablet does not blast the room at a dim wedding.
