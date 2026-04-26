/**
 * Re-exported AppRouter shape. The concrete `AppRouter` is defined in
 * `apps/web/src/server/api/root.ts`. We declare a structural placeholder here
 * so this package compiles standalone (the web app augments via module
 * declaration when actually used).
 *
 * Consumers should import the real router type from `@tinybooth/web` directly
 * and pass it as a generic, e.g. `createTRPCReact<WebAppRouter>()`. This file
 * exists for documentation and future shared types.
 */
export type AppRouterShape = unknown;
