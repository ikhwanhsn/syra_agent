import { POST_VIDEO_SLIDE_SLOTS } from "./videoSlideSlots";
import type { PostSlide, PostUpdate, PostUpdateMeta } from "./types";
import { getDuplicateLayouts, getLayoutKindMismatches } from "./validatePostUpdate";

/**
 * Build a video update with exactly 8 slides in canonical kind order.
 * Throws at import if misconfigured — use for all new ship logs.
 *
 * Visual style: preview + export always go through Remotion `PostDeckVideo`
 * (single Syra cinematic theme). New content inherits that look automatically —
 * do not add per-update video CSS.
 */
export function defineVideoUpdate(meta: PostUpdateMeta, slides: PostSlide[]): PostUpdate {
  const expectedKinds = POST_VIDEO_SLIDE_SLOTS.map((slot) => slot.kind);

  if (slides.length !== expectedKinds.length) {
    throw new Error(
      `[post/video] "${meta.id}" must have ${expectedKinds.length} slides in template order (got ${slides.length})`,
    );
  }

  for (let i = 0; i < expectedKinds.length; i++) {
    const expected = expectedKinds[i];
    const actual = slides[i]?.kind;
    if (actual !== expected) {
      throw new Error(
        `[post/video] "${meta.id}" slide ${i + 1}: expected kind "${expected}", got "${actual ?? "missing"}"`,
      );
    }
  }

  const mismatches = getLayoutKindMismatches(slides);
  if (mismatches.length > 0) {
    throw new Error(`[post/video] "${meta.id}" layout/kind mismatch:\n${mismatches.join("\n")}`);
  }

  if (import.meta.env.DEV) {
    const dupes = getDuplicateLayouts(slides);
    if (dupes.length > 0) {
      console.warn(
        `[post/video] "${meta.id}" reuses layout(s): ${dupes.join(", ")}. Use a unique layout per slide when possible.`,
      );
    }
  }

  return { meta, slides };
}
