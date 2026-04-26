# @tinybooth/web

The marketing site, dashboard, and serverless API for TinyBooth, served
from `tinybooth.com`. Built on Next.js 14 (App Router) and Tailwind CSS.

## Layout

- `app/`: App Router routes. Marketing pages, the `/dashboard` shell,
  the `/api` routes (tRPC, REST, cron, webhooks), and the metadata-route
  conventions (`sitemap.ts`, `robots.ts`, `manifest.ts`,
  `opengraph-image.tsx`).
- `content/blog/`: TypeScript modules (one per post) that export typed
  frontmatter and a server React body component. See
  `src/lib/blog.ts` for the implementation choice (no MDX runtime).
- `src/components/`: UI primitives, marketing components, dashboard
  components, blog typography, SEO JSON-LD helpers.
- `src/lib/`: server utilities (db, storage, email, sms, stripe,
  cleanup, blog registry, analytics).
- `src/server/api/`: tRPC routers.
- `prisma/`: Prisma schema and generated client.
- `__tests__/`: Vitest tests for every router, route handler, and
  marketing-page metadata export.

## Search console verification

Two placeholder files live in `public/`:

- `public/google-site-verification-placeholder.html`: drop in the real
  HTML file Google Search Console gives you (named like
  `google1234567890abcdef.html`) at the same path. Then click Verify.
- `public/BingSiteAuth.xml`: replace `REPLACE_WITH_BING_VERIFICATION_GUID`
  with the GUID Bing Webmaster Tools gives you. The file stays at the
  same path.

Camrynn handles both verifications post-launch when DNS is live on
`tinybooth.com`.

## Local commands

```bash
pnpm dev          # next dev on :3000
pnpm typecheck    # prisma generate + tsc --noEmit
pnpm test         # vitest run
pnpm build        # prisma generate + next build
```
