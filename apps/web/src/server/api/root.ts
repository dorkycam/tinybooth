/**
 * AppRouter root. Combines feature routers; consumed by the Next.js
 * `[trpc]` route handler and re-exported as a TS type for the shared client.
 */
import { router } from './trpc';
import { eventRouter } from './routers/event';
import { postRouter } from './routers/post';
import { stripRouter } from './routers/strip';
import { dashboardRouter } from './routers/dashboard';
import { messagesRouter } from './routers/messages';

export const appRouter = router({
  event: eventRouter,
  post: postRouter,
  strip: stripRouter,
  dashboard: dashboardRouter,
  messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
