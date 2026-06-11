import type { PostPhotoUpdate } from "./types";

/** Ready-to-post X copy for a specific photo card in an update. */
export function getPostPhotoShareCopy(post: PostPhotoUpdate, cardIndex: number): string {
  const card = post.cards[cardIndex];
  if (!card) return post.meta.shareCopyPhoto.trim();
  return card.shareCopy.trim();
}
