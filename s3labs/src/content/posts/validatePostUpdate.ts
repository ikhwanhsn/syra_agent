import { POST_LAYOUT_KIND } from "./layouts";
import type { PostSlideLayoutTemplate } from "./layouts";
import type { PostUpdate } from "./types";

export function getDuplicateLayouts(slides: PostUpdate["slides"]): PostSlideLayoutTemplate[] {
  const seen = new Set<PostSlideLayoutTemplate>();
  const dupes = new Set<PostSlideLayoutTemplate>();
  for (const slide of slides) {
    if (seen.has(slide.layout)) dupes.add(slide.layout);
    seen.add(slide.layout);
  }
  return [...dupes];
}

export function getLayoutKindMismatches(slides: PostUpdate["slides"]): string[] {
  const errors: string[] = [];
  for (const slide of slides) {
    const expected = POST_LAYOUT_KIND[slide.layout];
    if (expected !== slide.kind) {
      errors.push(`${slide.id}: layout "${slide.layout}" expects kind "${expected}", got "${slide.kind}"`);
    }
  }
  return errors;
}

/** Warn in dev when an update reuses layouts or mismatches kind. */
export function validatePostUpdate(post: PostUpdate): void {
  if (!import.meta.env.DEV) return;

  const dupes = getDuplicateLayouts(post.slides);
  if (dupes.length > 0) {
    console.warn(
      `[post] "${post.meta.id}" reuses layout(s): ${dupes.join(", ")}. Use a unique layout per slide when possible.`,
    );
  }

  const mismatches = getLayoutKindMismatches(post.slides);
  if (mismatches.length > 0) {
    console.warn(`[post] "${post.meta.id}" layout/kind mismatch:\n${mismatches.join("\n")}`);
  }
}
