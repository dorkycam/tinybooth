/**
 * Shared tRPC client factories. Consumers import these and pass their concrete
 * AppRouter type. Keeps client wiring identical across web, wall, and mobile.
 */
import {
  createTRPCClient,
  httpBatchLink,
  type CreateTRPCClient,
  type CreateTRPCClientOptions,
} from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { AnyRouter } from '@trpc/server';
import superjson from 'superjson';

export { superjson };
export type { AnyRouter };

/**
 * Build a vanilla (non-React) tRPC client. Use from server components, scripts,
 * or environments without React Query. Provide your AppRouter type as TRouter.
 *
 * @param baseUrl Absolute URL where the tRPC route is mounted.
 * @param headers Optional additional headers (auth, etc.).
 */
export function createVanillaClient<TRouter extends AnyRouter>(
  baseUrl: string,
  headers: Record<string, string> = {},
): CreateTRPCClient<TRouter> {
  // In tRPC v11 the `transformer` field on the link is structurally typed
  // against the router's `_config.$types`. Because `TRouter extends AnyRouter`
  // is intentionally loose here, type inference fails. We narrow at the
  // boundary so consumers still get the typed proxy out the other side.
  // TODO: tighten when @trpc/client exports a public TransformerOptions type
  // (tracked at trpc.io/docs/v11/data-transformers).
  const linkOpts = {
    url: `${baseUrl}/api/trpc`,
    headers,
    transformer: superjson,
  } as Parameters<typeof httpBatchLink>[0];
  const link = httpBatchLink(linkOpts);
  const opts: CreateTRPCClientOptions<TRouter> = {
    links: [link],
  };
  return createTRPCClient<TRouter>(opts);
}

/**
 * Build a React tRPC factory. Returns the React hooks namespace; mount
 * <Provider/> with QueryClientProvider yourself in the consumer app.
 */
export function createReactClient<TRouter extends AnyRouter>(): ReturnType<
  typeof createTRPCReact<TRouter>
> {
  return createTRPCReact<TRouter>();
}

/**
 * Standard React Query + tRPC client config. Useful default for the wall + web
 * apps. Mobile uses the same shape with a different base URL.
 */
export interface RealtimeFallbackOptions {
  /** Polling interval when realtime is unavailable. */
  pollingMs: number;
}

export const DEFAULT_REALTIME_FALLBACK: RealtimeFallbackOptions = {
  pollingMs: 5000,
};
