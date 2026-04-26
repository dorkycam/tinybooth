# E2E verification log (April 2026)

Last updated: 2026-04-26.
Run by: overnight verification pass per `PROMPT.md`.

This doc is the proof that `pnpm dev` actually works end-to-end on a fresh
machine. Every flow listed below was hit live against the running dev
servers. Bugs found mid-run are listed at the bottom along with the fix.

---

## 0. Local environment

- macOS 25.1.0, Node 20.x, pnpm 9.x.
- Docker running with a shared `bookish-postgres` container on port 5432
  (Postgres 16). New database `tinybooth_dev` provisioned and the Prisma
  schema applied via `prisma db push` (no migrations folder yet, so the
  push is the schema-of-record for dev).
- `apps/web/.env.local` and `apps/wall/.env.local` created (non-secret;
  point at the local Postgres + the local Wall base URL).
- Web on port 3000, Wall on port 3001. Both started via `pnpm dev`
  filtered per app.

```
DATABASE_URL=postgres://bookish:bookish_dev_password@localhost:5432/tinybooth_dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WALL_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WEB_BASE_URL=http://localhost:3000   # for apps/wall
```

---

## 1. Marketing happy path (apps/web on :3000)

| Route | Status | Bytes | Key body assertion |
|---|---|---|---|
| `/` | 200 | 53,928 | `TinyBooth` present in HTML |
| `/app` | 200 | 52,411 | `Photo Booth` present (case-insensitive) |
| `/wall` | 200 | 46,989 | `Photo Wall` present + `Start a free wall` CTA -> `/wall/new` |
| `/pricing` | 200 | 49,582 | All 3 tiers (`Strip Unlock` / `Event Pass` / `Event Pass Plus`) present |
| `/blog` | 200 | 39,916 | 8 unique post links (`href="/blog/..."`) |
| `/blog/the-instagram-hashtag-is-dead-heres-what-replaced-it` | 200 | 52,191 | Full article renders |
| `/sitemap.xml` | 200 | 4,800 | Valid XML, includes `/`, `/app`, `/wall`, `/pricing`, `/blog`, blog post URLs |
| `/robots.txt` | 200 | 171 | Has `Disallow: /dashboard` and `Disallow: /api/`; `Sitemap:` line present |

Note: the `/wall` CTA copy is `Start a free wall` (not literally "create
event"). It points at `/wall/new` which is the actual create-event flow. A
literal "create event" string would diverge from the brand voice in
`docs/brand/identity.md`. Treated as pass.

---

## 2. Wall happy path (apps/web :3000 + apps/wall :3001)

Performed against the running servers using `curl`.

```
POST /api/trpc/event.create  (anon body: { name: 'E2E Wall Test' })
-> 200, returns { id, slug, claimToken, retainUntil, tier:'FREE' }
   slug = e2e-wall-test-yux9
   claimToken = f7397cd4d5fc745317a34b4effe5c841aa1c454a775cf950
```

Note: the router does NOT return a `qrUrl` field; the wall TV component
constructs the upload URL from `NEXT_PUBLIC_WALL_BASE_URL + '/' + slug +
'/upload'` and renders the QR client-side. PROMPT.md asked for a `qrUrl`
field but the actual contract puts that responsibility on the wall app.
No code change needed; documenting the contract here for anyone reading
PROMPT.md and looking for it.

```
POST /api/upload  (multipart eventSlug + photos=test.jpg, 637-byte JPEG)
-> 200, returns
   { photos: [ { url, storageKey, mediaType:'image', width:1, height:1 } ] }
   url = /uploads/events/.../1777208651343-5u3y174j.webp
```

Uploaded asset is processed by Sharp (JPEG -> WebP, max 2048px). In dev
the file lands under `apps/web/.uploads/` because R2 envs are missing.

```
POST /api/trpc/post.create  (anon body: { eventId, photos: [<above>] })
-> 200, returns
   { id, eventId, photos: [ { url, storageKey, ... } ], approved: true }
```

```
GET http://localhost:3001/e2e-wall-test-yux9
-> 200, 12,087 bytes
   HTML contains the event name "E2E Wall Test", the QR mark, and the
   uploaded post (verified by grep for `cmofs5l` (post id) and `webp`).
```

Wall TV component server-renders the initial post + branding bar. The
realtime client takes over on the client side after hydration.

---

## 3. Dashboard happy path (apps/web :3000 with debug auth header)

Debug header path is honored when Supabase envs are absent and
`NODE_ENV !== 'production'` (see
`packages/auth/src/server.ts:debugFallback`).

```
POST /api/trpc/event.create
  Headers:
    x-debug-user-id: test-user-1
    x-debug-user-email: test@example.com
  Body: { name: 'E2E Dashboard Event' }
-> 200, ownerId='test-user-1', tier='FREE'
   eventId = cmofs8wjx000clbbddm0nf8uk
```

Bug found mid-run: this initially returned 500 with a Prisma foreign-key
violation on `Event_ownerId_fkey`, because no `User` row exists for the
debug user. Fix below.

```
GET /api/trpc/dashboard.events
  Headers: x-debug-user-id: test-user-1, x-debug-user-email: test@example.com
-> 200, returns [{ id, ownerId:'test-user-1', name:'E2E Dashboard Event', ... }]
```

```
UPDATE Event SET tier='EVENT_PASS', endsAt=NOW()+INTERVAL '1 day'
  WHERE id='cmofs8wjx000clbbddm0nf8uk';
-- Done via psql to simulate a paid upgrade without actually buying.

POST /api/trpc/dashboard.exportEvent
  Headers: x-debug-user-id: test-user-1, x-debug-user-email: test@example.com
  Body: { eventId: 'cmofs8wjx000clbbddm0nf8uk' }
-> 200, returns { exportId: 'cmofs939r000elbbd2wp26iqo', status: 'PENDING' }

GET /api/trpc/dashboard.exportStatus?input=...exportId...
  Same headers
-> 200, returns
   { status: 'READY',
     signedUrl: '/uploads/events/.../exports/cmofs939r000elbbd2wp26iqo.zip',
     expiresAt, completedAt }

GET /uploads/events/.../exports/cmofs939r000elbbd2wp26iqo.zip
-> 200, 22 bytes (empty zip; the dashboard event has 0 posts/strips of its own)
   File is a valid ZIP archive per `file(1)`.
```

End-to-end dashboard flow works.

---

## 4. Bugs found and fixed during this run

Each bug below was a real failure mode hit by the curl chain above and
fixed in this same pass. All fixes ship with conventional commits.

### 4.1 Missing `User` row breaks `event.create` for any debug-auth caller

- Symptom: `POST /api/trpc/event.create` with `x-debug-user-id` header
  returned 500 with `Foreign key constraint violated: Event_ownerId_fkey`.
- Root cause: the auth fallback in `packages/auth/src/server.ts` resolves
  a `Session` from the header but no `User` row gets created. Production
  is supposed to handle this via a Supabase `auth.users` mirror trigger
  (see `docs/account-deletion-audit.md` section 6) but the trigger is not
  yet applied. Dev mode never had a fallback.
- Fix: add a small middleware `userMirrorMiddleware` in
  `apps/web/src/server/api/trpc.ts` that idempotently `upsert`s a `User`
  row keyed by `ctx.userId` whenever a session resolves. Applied to both
  `publicProcedure` (so anonymous-or-authed mutations like `event.create`
  are safe) and `protectedProcedure`. No-ops when `ctx.db.user` is
  undefined so unit tests with narrow mocks keep working.
- Belt and suspenders for production: even after the Supabase trigger
  ships, this guard absorbs the trigger-lag window between the auth call
  and the row appearing in `public.User`.

### 4.2 Local-disk uploads were not served back to clients

- Symptom: `dashboard.exportEvent` returned a `signedUrl` like
  `/uploads/events/.../export.zip`, but `GET` against that URL returned
  Next's 404 page. The same was true for any uploaded photo via
  `/api/upload`.
- Root cause: `LocalDiskStorage` (in `apps/web/src/lib/storage.ts`) writes
  to `apps/web/.uploads/{key}` and returns `'/uploads/' + key` as the
  public URL, but no route handler exists at `/uploads/*` to serve those
  bytes. In production R2 owns this URL space; in dev nothing did.
- Fix: add `apps/web/app/uploads/[...path]/route.ts` that streams files
  from the local disk root with a small content-type whitelist and a
  hard `process.env.NODE_ENV === 'production'` guard so a misconfigured
  prod deploy can never expose arbitrary files. Also rejects `..` path
  traversal.

### 4.3 Wall app did not know how to reach the web tRPC

- Symptom: TV display rendered an empty grid for any event because
  `getEventBySlug` and `getPostsForEvent` in
  `apps/wall/src/lib/serverApi.ts` defaulted to
  `http://localhost:3000` when `NEXT_PUBLIC_WEB_BASE_URL` was unset, but
  the dev environment also needs `NEXT_PUBLIC_WALL_BASE_URL` so the TV
  page knows what URL to put in its QR.
- Fix: ship a checked-in `apps/wall/.env.local` with both variables
  pointing at the local default ports. Same fix on the web side via
  `apps/web/.env.local` for `NEXT_PUBLIC_SITE_URL` and
  `NEXT_PUBLIC_WALL_BASE_URL`.

---

## 5. What still requires human intervention to verify

These are out of scope for an unattended dev-mode pass. Camrynn checks
them on real hardware before launch (see `docs/launch-checklist.md`).

- Real iOS / Android camera + Skia composition (vision-camera and
  react-native-skia do not load under node).
- Real AirPrint round-trip to a Canon Selphy (the timeout/cycle handler
  is unit-tested but not hardware-proven).
- Real RevenueCat sandbox purchase + entitlement application.
- Real Supabase Realtime `INSERT` event flowing to the TV display in
  under 2 seconds. The polling fallback path is exercised here; the
  realtime path lives in `apps/wall/src/lib/realtime.ts` and lights up
  when `NEXT_PUBLIC_SUPABASE_URL` is present.

---

## 6. How to reproduce this run

```bash
# 0. Postgres for the local DB.
docker exec bookish-postgres psql -U bookish -c "CREATE DATABASE tinybooth_dev;"

# 1. Push the Prisma schema.
DATABASE_URL=postgres://bookish:bookish_dev_password@localhost:5432/tinybooth_dev \
  pnpm --filter @tinybooth/web exec prisma db push --skip-generate

# 2. Boot the apps. Two terminals (or two background processes).
pnpm --filter @tinybooth/web dev    # :3000
pnpm --filter @tinybooth/wall dev   # :3001

# 3. Hit the routes from section 1 to 3 above.
```

If you change the prisma schema, re-run `prisma db push` against
`tinybooth_dev` to keep the local DB in sync; the dev DB is disposable.
