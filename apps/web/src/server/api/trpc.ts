/**
 * tRPC v11 init. Sets up the request context (db client + optional user id),
 * the superjson transformer, and the procedure helpers consumed by routers.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '../../lib/db';

export interface ApiContext {
  db: typeof db;
  /** Authed user id, or null for anonymous callers. */
  userId: string | null;
}

/**
 * Build a request context. The Phase 1 implementation reads the user id from a
 * debug header (`x-tinybooth-user`); Phase 3 swaps in real Supabase JWT
 * verification without breaking any router signatures.
 */
export function getUserFromHeaders(headers: Headers): string | null {
  const debug = headers.get('x-tinybooth-user');
  return debug && debug.length > 0 ? debug : null;
}

/**
 * Build the request context from a fetch-API Request. Used by the App Router
 * `[trpc]` route handler.
 */
export function createContext(req: Request): ApiContext {
  return { db, userId: getUserFromHeaders(req.headers) };
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
 * Procedure that requires an authenticated user. Phase 1 enforces only the
 * presence of a user id; Phase 3 wires the real Supabase Auth JWT verification
 * via `createContext`.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sign-in required.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const mergeRouters = t.mergeRouters;
