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
export const publicProcedure = t.procedure;

/**
 * Procedure that requires an authenticated user. Throws a typed UNAUTHORIZED
 * tRPC error so clients can surface a "please sign in" UI without parsing
 * messages.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign-in required.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const mergeRouters = t.mergeRouters;
