/**
 * Prisma client singleton.
 *
 * The generated client lives in `prisma/generated/client` (custom output) so it
 * does not collide with the workspace symlink layout. Next.js dev mode reuses
 * the same global instance to avoid spawning a connection pool per HMR cycle.
 */
import { PrismaClient } from '../../prisma/generated/client';

declare global {
  // eslint-disable-next-line no-var
  var __TINYBOOTH_PRISMA__: PrismaClient | undefined;
}

/**
 * Build (or reuse) the singleton Prisma client.
 */
function makeClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['warn', 'error']
        : ['error'],
  });
}

export const db: PrismaClient = globalThis.__TINYBOOTH_PRISMA__ ?? makeClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__TINYBOOTH_PRISMA__ = db;
}
