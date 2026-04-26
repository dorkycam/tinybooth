# Prisma schema for `@tinybooth/web`

Single Postgres schema shared by web + wall + (eventually) mobile via the tRPC
layer. Generated client output lives in `prisma/generated/client` so the
workspace can vendor it without colliding with `node_modules` symlink layouts.

## Local dev

```bash
pnpm --filter @tinybooth/web prisma:generate   # offline
DATABASE_URL=postgres://... pnpm --filter @tinybooth/web exec prisma migrate dev
```

`build` and `typecheck` both run `prisma generate` first so the client is
always in sync with the schema before tsc/Next look at it.

## Phase 3 RLS test plan (TODO)

When Supabase Auth ships in Phase 3, every Row-Level Security policy on
`Event`, `Post`, `Photo`, `Strip`, `CustomMessage`, `Purchase`, and
`Subscription` must be exercised against a `pgTAP` suite running in CI against
a Supabase test project. Outline:

1. Spin up a disposable schema (`pgtap_test_<run-id>`).
2. Apply the Prisma migration against it.
3. Apply the RLS policies (kept in `apps/web/prisma/policies/*.sql`).
4. For each (role, table, operation) tuple, assert allow vs deny.
5. Roles to cover: `service_role`, `authenticated` (multiple impersonations),
   and `anon`.

Acceptance: 100% policy coverage, run wall-clock under 90 seconds.

The `infra/terraform/` skeleton already has a `staging` env where a Supabase
project URL plus service-role key can be wired without touching production
data.
