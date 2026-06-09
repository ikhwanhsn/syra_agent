import { POST_PHOTO_LAYOUTS } from "./layouts";
import type { PostPhotoLayoutTemplate } from "./layouts";
import type { PostPhotoUpdate } from "./types";

export function getInvalidPhotoPicks(picks: PostPhotoLayoutTemplate[]): PostPhotoLayoutTemplate[] {
  const valid = new Set<string>(POST_PHOTO_LAYOUTS);
  return picks.filter((p) => !valid.has(p));
}

export function getDuplicatePhotoPicks(picks: PostPhotoLayoutTemplate[]): PostPhotoLayoutTemplate[] {
  const seen = new Set<PostPhotoLayoutTemplate>();
  const dupes = new Set<PostPhotoLayoutTemplate>();
  for (const pick of picks) {
    if (seen.has(pick)) dupes.add(pick);
    seen.add(pick);
  }
  return [...dupes];
}

/** Resolve the templates shown for an update — picks when set, otherwise full library. */
export function getPostPhotoPicks(post: PostPhotoUpdate): PostPhotoLayoutTemplate[] {
  return post.picks.length > 0 ? post.picks : [...POST_PHOTO_LAYOUTS];
}

/** Templates in the library but not in this update's picks. */
export function getPostPhotoLibraryRest(post: PostPhotoUpdate): PostPhotoLayoutTemplate[] {
  const picked = new Set(getPostPhotoPicks(post));
  return POST_PHOTO_LAYOUTS.filter((layout) => !picked.has(layout));
}

/** Warn in dev when picks are invalid or duplicated. */
export function validatePostPhotoUpdate(post: PostPhotoUpdate): void {
  if (!import.meta.env.DEV) return;

  const invalid = getInvalidPhotoPicks(post.picks);
  if (invalid.length > 0) {
    console.warn(`[post/photo] "${post.meta.id}" has unknown pick(s): ${invalid.join(", ")}`);
  }

  const dupes = getDuplicatePhotoPicks(post.picks);
  if (dupes.length > 0) {
    console.warn(`[post/photo] "${post.meta.id}" reuses pick(s): ${dupes.join(", ")}`);
  }

  if (post.picks.length === 0) {
    console.warn(`[post/photo] "${post.meta.id}" has no picks — UI will show the full template library.`);
  }

  const missingShareCopy = post.picks.filter((pick) => !post.shareCopyByLayout?.[pick]?.trim());
  if (missingShareCopy.length > 0) {
    console.warn(
      `[post/photo] "${post.meta.id}" missing shareCopyByLayout for pick(s): ${missingShareCopy.join(", ")}`,
    );
  }
}
