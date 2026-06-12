import type { PostSlide } from "@/content/posts/types";

/** Matches `.post-reveal-active` animation duration in CSS. */
export const REVEAL_ANIMATION_MS = 750;
/** Time for PostSlideFit to settle after stagger/reveal. */
export const SLIDE_FIT_SETTLE_MS = 950;
/** Minimum dwell per slide — matches natural preview pacing. */
export const SLIDE_INTERVAL_MS = 5200;
/** Minimum dwell on the final slide. */
export const LAST_SLIDE_DWELL_MS = 7000;
/** Read hold once entrance finishes (non-last slides). */
export const POST_ENTRANCE_HOLD_MS = 4000;
/** Read hold on the final slide. */
export const LAST_SLIDE_POST_ENTRANCE_HOLD_MS = 5500;

function entranceFromStagger(baseDelayMs: number, itemCount: number, staggerMs: number): number {
  if (itemCount <= 0) return baseDelayMs + REVEAL_ANIMATION_MS;
  return baseDelayMs + (itemCount - 1) * staggerMs + REVEAL_ANIMATION_MS;
}

/** Estimate when the last reveal on a slide finishes. */
export function estimateSlideEntranceMs(slide: PostSlide): number {
  switch (slide.kind) {
    case "cover":
      return 240 + REVEAL_ANIMATION_MS;
    case "statement":
      return 220 + REVEAL_ANIMATION_MS;
    case "hero":
      return entranceFromStagger(240, slide.highlights.length, 70);
    case "flow":
      return entranceFromStagger(160, slide.steps.length, 80);
    case "cards":
      return entranceFromStagger(260, slide.cards.length, 70);
    case "surfaces":
      return entranceFromStagger(280, slide.items.length, 70);
    case "impact":
      return entranceFromStagger(420, slide.stats.length, 80);
    case "closing":
      return entranceFromStagger(220, slide.links.length, 70);
    default:
      return 240 + REVEAL_ANIMATION_MS;
  }
}

/** How long export captures entrance frame-by-frame for a slide. */
export function getEntranceCaptureMs(slide: PostSlide): number {
  return Math.min(2400, Math.max(1600, estimateSlideEntranceMs(slide) + 350));
}

export function getSlideDwellMs(slideIndex: number, slides: PostSlide[]): number {
  const isLast = slideIndex >= slides.length - 1;
  const floor = isLast ? LAST_SLIDE_DWELL_MS : SLIDE_INTERVAL_MS;
  const slide = slides[slideIndex];

  if (!slide) return floor;

  const hold = isLast ? LAST_SLIDE_POST_ENTRANCE_HOLD_MS : POST_ENTRANCE_HOLD_MS;
  const contentBased = estimateSlideEntranceMs(slide) + hold;
  return Math.max(floor, contentBased);
}
