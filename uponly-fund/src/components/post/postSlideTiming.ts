import type { PostSlide } from "@/content/posts/types";

export const POST_VIDEO_FPS = 30;
/** Matches `.post-reveal-active` animation duration in CSS. */
export const REVEAL_ANIMATION_MS = 750;
/** Read time after entrance finishes. */
export const SLIDE_READ_HOLD_MS = 4000;
export const FIRST_SLIDE_READ_HOLD_MS = 3600;
export const LAST_SLIDE_READ_HOLD_MS = 4200;
/** Regular slides target ~5–6s; last slide gets a bit more. */
export const SLIDE_MAX_DWELL_MS = 5800;
export const LAST_SLIDE_MAX_DWELL_MS = 6400;

/** @deprecated Use getSlideDwellMs */
export const SLIDE_INTERVAL_MS = SLIDE_MAX_DWELL_MS;
export const LAST_SLIDE_DWELL_MS = LAST_SLIDE_MAX_DWELL_MS;

function entranceFromStagger(baseDelayMs: number, itemCount: number, staggerMs: number): number {
  if (itemCount <= 0) return baseDelayMs + REVEAL_ANIMATION_MS;
  return baseDelayMs + (itemCount - 1) * staggerMs + REVEAL_ANIMATION_MS;
}

export function estimateSlideEntranceMs(slide: PostSlide): number {
  switch (slide.kind) {
    case "cover":
      return 420 + REVEAL_ANIMATION_MS;
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

export function getEntranceCaptureMs(slide: PostSlide): number {
  return estimateSlideEntranceMs(slide) + 100;
}

export function getSlideDwellMs(slideIndex: number, slides: PostSlide[]): number {
  const isLast = slideIndex >= slides.length - 1;
  const slide = slides[slideIndex];
  const cap = isLast ? LAST_SLIDE_MAX_DWELL_MS : SLIDE_MAX_DWELL_MS;
  if (!slide) return cap;

  const readHold = isLast
    ? LAST_SLIDE_READ_HOLD_MS
    : slideIndex === 0
      ? FIRST_SLIDE_READ_HOLD_MS
      : SLIDE_READ_HOLD_MS;
  return Math.min(cap, estimateSlideEntranceMs(slide) + readHold);
}

export function getSlideHoldMs(slideIndex: number, slides: PostSlide[]): number {
  const dwell = getSlideDwellMs(slideIndex, slides);
  const slide = slides[slideIndex];
  const entrance = slide ? getEntranceCaptureMs(slide) : 1100;
  return Math.max(0, dwell - entrance);
}

export function getTotalVideoFrameCount(slides: PostSlide[], fps = POST_VIDEO_FPS): number {
  const frameIntervalMs = 1000 / fps;
  let total = 0;
  for (let i = 0; i < slides.length; i += 1) {
    total += Math.ceil(getSlideDwellMs(i, slides) / frameIntervalMs);
  }
  return total;
}

export function getTotalVideoDurationMs(slides: PostSlide[]): number {
  let total = 0;
  for (let i = 0; i < slides.length; i += 1) {
    total += getSlideDwellMs(i, slides);
  }
  return total;
}
