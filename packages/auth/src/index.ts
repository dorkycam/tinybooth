/**
 * Barrel export for `@tinybooth/auth`.
 *
 * Three slices:
 *   - `types`: shared Session + AuthUser shape.
 *   - `client`: Supabase browser + server client factories.
 *   - `server`: getSession / requireSession helpers used by tRPC + REST.
 */
export * from './types';
export * from './client';
export * from './server';
