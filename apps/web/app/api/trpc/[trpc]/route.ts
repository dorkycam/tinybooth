/**
 * Next.js App Router handler that mounts the tRPC HTTP server at /api/trpc/*.
 * Single function reused for GET (queries) and POST (mutations).
 */
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../src/server/api/root';
import { createContext } from '../../../../src/server/api/trpc';

const handler = (req: Request): Promise<Response> =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError({ error, path }) {
      // eslint-disable-next-line no-console
      console.error(`[trpc] ${path ?? '<unknown>'} ->`, error.message);
    },
  });

export { handler as GET, handler as POST };
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
