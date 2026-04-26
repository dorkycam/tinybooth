# 0002. Supabase Postgres over Neon

- Status: accepted
- Date: 2026-04-26
- Deciders: Camrynn

## Context

The existing TinyWall runs on what Vercel calls "Vercel Postgres," which is a Neon project under the hood. We need to pick a database for TinyBooth + TinyWall going forward. Requirements: Postgres, hosted, multi-tenant safe, with Auth and Realtime support so a guest upload appears on the TV in under two seconds without us writing a websocket layer.

We considered:

- Stay on Neon. Cheap, serverless, branching is great. But we still need to bolt on a separate Auth provider (Clerk or Auth.js) and a separate Realtime provider (Pusher or Ably). Three vendors instead of one.
- Supabase Postgres. Includes Auth (Apple/Google/email magic link config), Realtime (Postgres CDC channels for the TV slideshow), and Storage. Row-Level Security solves multi-tenant event ownership in SQL instead of in middleware.
- AWS RDS. Most flexible but most operational overhead. No bundled Auth or Realtime.

## Decision

Use Supabase Postgres. Move TinyWall data off Neon during Phase 1. Bundle Auth, Realtime, and (optionally later) Storage on the same vendor.

## Consequences

- One vendor for DB, Auth, and Realtime keeps the bill predictable. Supabase Pro at $25/mo covers the staging and production projects until paid traffic justifies a tier bump.
- Row-Level Security policies live with the schema, not in app middleware, which makes "anyone can read by slug, only owner can write" a single SQL clause.
- Supabase free tier pauses after 7 days of inactivity. Move staging to Pro the moment we have a real test event running.
- The migration script in `scripts/migrate-tinywall.ts` reads the Neon CSV dump and uploads to Supabase + R2 in one pass. Old Vercel Postgres stays alive for 90 days as backup.
- We are not married to Supabase. The schema is pure Postgres, RLS policies port to any Postgres host, and we can swap Auth for Clerk in a week if Supabase Auth ships a deal-breaker bug.
