import type { PostUpdateMeta } from "@/content/posts/types";
import { POST_PHOTO_CARD_SLOTS } from "./photoCardSlots";
import type { PostPhotoCardDef, PostPhotoUpdate } from "./types";

/** Build a photo update with exactly 15 cards in slot order. Throws at import if misconfigured. */
export function definePhotoUpdate(meta: PostUpdateMeta, cards: PostPhotoCardDef[]): PostPhotoUpdate {
  const expectedRoles = POST_PHOTO_CARD_SLOTS.map((slot) => slot.role);

  if (cards.length !== expectedRoles.length) {
    throw new Error(
      `[post/photo] "${meta.id}" must have ${expectedRoles.length} cards (got ${cards.length})`,
    );
  }

  for (let i = 0; i < expectedRoles.length; i++) {
    const expected = expectedRoles[i];
    const actual = cards[i]?.role;
    if (actual !== expected) {
      throw new Error(
        `[post/photo] "${meta.id}" card ${i + 1}: expected role "${expected}", got "${actual ?? "missing"}"`,
      );
    }
  }

  return { meta, cards };
}
