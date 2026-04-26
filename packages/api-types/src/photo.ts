/**
 * Photo is a single media file. It may belong to a `Post` (TinyWall guest
 * upload) or a `Strip` (TinyBooth photostrip frame). Exactly one of `postId`
 * or `stripId` is set.
 */
export type PhotoMediaType = 'image' | 'video';

export interface Photo {
  id: string;
  postId: string | null;
  stripId: string | null;
  url: string;
  storageKey: string;
  mediaType: PhotoMediaType;
  width: number;
  height: number;
  order: number;
  createdAt: string;
}
