import { POST_PHOTO_LAYOUTS } from "./layouts";
import type { PostPhotoLayoutTemplate } from "./layouts";
import { POST_PHOTO_CARD_COUNT, POST_PHOTO_CARD_SLOTS } from "./photoCardSlots";
import type { PostPhotoUpdate } from "./types";

const VALID_LAYOUTS = new Set<string>(POST_PHOTO_LAYOUTS);

export function getInvalidPhotoLayouts(layouts: PostPhotoLayoutTemplate[]): PostPhotoLayoutTemplate[] {
  return layouts.filter((layout) => !VALID_LAYOUTS.has(layout));
}

/** Warn in dev when cards are misconfigured. */
export function validatePostPhotoUpdate(post: PostPhotoUpdate): void {
  if (!import.meta.env.DEV) return;

  if (post.cards.length !== POST_PHOTO_CARD_COUNT) {
    console.warn(
      `[post/photo] "${post.meta.id}" must have exactly ${POST_PHOTO_CARD_COUNT} cards (got ${post.cards.length})`,
    );
  }

  const invalidLayouts = getInvalidPhotoLayouts(post.cards.map((card) => card.layout));
  if (invalidLayouts.length > 0) {
    console.warn(`[post/photo] "${post.meta.id}" has unknown layout(s): ${invalidLayouts.join(", ")}`);
  }

  const missingShareCopy = post.cards.filter((card) => !card.shareCopy.trim());
  if (missingShareCopy.length > 0) {
    console.warn(
      `[post/photo] "${post.meta.id}" missing shareCopy for card(s): ${missingShareCopy.map((c) => c.role).join(", ")}`,
    );
  }

  const expectedRoles = POST_PHOTO_CARD_SLOTS.map((slot) => slot.role);
  for (let i = 0; i < expectedRoles.length; i++) {
    if (post.cards[i]?.role !== expectedRoles[i]) {
      console.warn(
        `[post/photo] "${post.meta.id}" card ${i + 1}: expected role "${expectedRoles[i]}", got "${post.cards[i]?.role ?? "missing"}"`,
      );
    }
  }
}
