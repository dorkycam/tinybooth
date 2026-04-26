/**
 * tRPC v11 init. Sets up the request context (db client + optional session),
 * the superjson transformer, and the procedure helpers consumed by routers.
 *
 * Phase 3 swaps the Phase-1 placeholder header (`x-tinybooth-user`) for the
 * shared `@tinybooth/auth` resolver. The same module honors a debug header
 * (`x-debug-user-id`) when Supabase envs are absent and `NODE_ENV !=='production'`
 * so local dev + CI keep working without real auth.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { getSession, type Session } from '@tinybooth/auth';
import { db } from '../../lib/db';

export interface ApiContext {
  db: typeof db;
  /** Authed user id, or null for anonymous callers. */
  userId: string | null;
  /** Resolved auth user email, or null. Optional for tests. */
  userEmail?: string | null;
  /** Bearer access token, when present. Optional for tests. */
  accessToken?: string | null;
}

/**
 * Build the request context from a fetch-API Request. Used by the App Router
 * `[trpc]` route handler.
 */
export async function createContext(req: Request): Promise<ApiContext> {
  const session = await getSession(req.headers);
  return contextFromSession(session);
}

/** Synthesize a context from an already-resolved session. Test helper. */
export function contextFromSession(session: Session | null): ApiContext {
  return {
    db,
    userId: session?.userId ?? null,
    userEmail: session?.user.email ?? null,
    accessToken: session?.accessToken ?? null,
  };
}

const t = initTRPC.context<ApiContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;

/**
 * Base middleware that mirrors the resolved auth user into the local `User`
 * table whenever `ctx.userId` is present. Anonymous calls (`userId === null`)
 * pass through untouched. Idempotent via `upsert`.
 *
 * Why: any procedure that writes a row with a user-id foreign key (`event.ownerId`,
 * `purchase.userId`, `export.userId`) needs a `User` row to exist first. In
 * production a Supabase `auth.users` trigger handles this; in dev/CI and during
 * trigger-lag windows we mirror here so the foreign key constraint never trips.
 */
const userMirrorMiddleware = t.middleware(async ({ ctx, next }) => {
  await ensureUserRow(ctx);
  return next({ ctx });
});

export const publicProcedure = t.procedure.use(userMirrorMiddleware);

/**
 * Procedure that requires an authenticated user. Throws a typed UNAUTHORIZED
 * tRPC error so clients can surface a "please sign in" UI without parsing
 * messages.
 *
 * Side-effect: upserts the local `User` row keyed by the auth user id so any
 * downstream `Event.ownerId` foreign keys are satisfied. In production this
 * mirroring is also handled by the Supabase `auth.users` trigger (see
 * `docs/account-deletion-audit.md` section 6); the upsert here is the dev/CI
 * fallback plus a belt-and-suspenders guard for the trigger lag window.
 */
export const protectedProcedure = t.procedure.use(userMirrorMiddleware).use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign-in required.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

/**
 * Idempotently ensure a `User` row exists for the resolved auth user. Uses
 * `upsert` so concurrent first calls do not race on the unique constraint.
 * Email may be missing for the debug-header dev path; we synthesize a stable
 * placeholder so the unique constraint is still satisfied.
 *
 * Tests pass narrow `db` mocks that omit the `user` delegate; we no-op in
 * that case so unit tests do not have to wire a full Prisma surface.
 */
async function ensureUserRow(ctx: ApiContext): Promise<void> {
  if (!ctx.userId) return;
  const userDelegate = (ctx.db as { user?: { upsert?: (...args: unknown[]) => Promise<unknown> } })
    .user;
  if (!userDelegate || typeof userDelegate.upsert !== 'function') return;
  const fallbackEmail = `${ctx.userId}@local.tinybooth.dev`;
  const email = ctx.userEmail && ctx.userEmail.length > 0 ? ctx.userEmail : fallbackEmail;
  await userDelegate.upsert({
    where: { id: ctx.userId },
    update: {},
    create: { id: ctx.userId, email },
  });
}

export const mergeRouters = t.mergeRouters;
