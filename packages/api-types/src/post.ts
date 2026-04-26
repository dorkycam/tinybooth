/**
 * Post is a single TinyWall guest upload submission. Each post can hold one or
 * more `Photo` entries (e.g. a guest who uploaded three pictures at once).
 */
export interface Post {
  id: string;
  eventId: string;
  caption: string | null;
  uploaderToken: string | null;
  approved: boolean;
  createdAt: string;
}
