/**
 * Authenticated user. Mirrors `auth.users` in Supabase via a trigger that keeps
 * the public `User` row in sync. Anonymous TinyWall guests are NOT users.
 */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}
