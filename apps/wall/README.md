# TinyWall (Next.js)

The TV display + guest upload app for TinyWall. The product landing page lives
on the marketing app at `tinybooth.com/wall`; this app handles per-event
routes:

- `GET /[slug]` - TV display (full-viewport grid, QR overlay, realtime).
- `GET /[slug]/upload` - guest upload state machine (welcome, capture, preview,
  upload, success).

## Local dev

```bash
pnpm --filter @tinybooth/web dev   # http://localhost:3000  (web + tRPC + REST)
pnpm --filter @tinybooth/wall dev  # http://localhost:3001  (wall pages)
```

The wall app calls the web app's tRPC + REST endpoints via the
`NEXT_PUBLIC_WEB_BASE_URL` env var. Default is `http://localhost:3000`.

When `NEXT_PUBLIC_SUPABASE_URL` is unset, the realtime subscription falls back
to 5-second polling against `post.list` so the slideshow keeps updating.

## Required env vars

| Var | Purpose | Required? |
| --- | --- | --- |
| `NEXT_PUBLIC_WEB_BASE_URL` | Where to call tRPC/REST | yes in prod |
| `NEXT_PUBLIC_WALL_BASE_URL` | Origin baked into QR codes on the TV view | yes in prod |
| `NEXT_PUBLIC_SUPABASE_URL` | Realtime CDC channel | optional |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Realtime CDC channel | optional |

## Vercel redirects: wall.tinybooth.com -> tinybooth.com/wall

The plan (`docs/plan.md` section 4, Phase 1) calls for migrating
`wall.tinybooth.com` to a subdirectory. Until DNS moves, the legacy subdomain
should be configured as a redirect-only Vercel project that 301s every path.
The configuration to apply on the legacy project (do not apply yet, no DNS
access):

```jsonc
// vercel.json on the legacy wall.tinybooth.com project
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://tinybooth.com/wall/:path*",
      "permanent": true
    }
  ]
}
```

We keep that legacy project alive for 12 months so any cached QR codes from
the original event still resolve to the new wall.

The active wall app (this package) is mounted at the apex of the new wall
domain (e.g. `wall.tinybooth.com` post-migration, or `events.tinybooth.com`
during Phase 1 testing). The redirect lives only on the legacy hostname.
