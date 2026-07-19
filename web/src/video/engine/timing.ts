import type { PostSlide } from "@/content/posts/types";
import {
  getSlideDwellMs,
  getTotalVideoDurationMs,
  getTotalVideoFrameCount,
  POST_VIDEO_FPS,
  REVEAL_ANIMATION_MS,
} from "@/components/post/postSlideTiming";

export { POST_VIDEO_FPS, REVEAL_ANIMATION_MS, getTotalVideoDurationMs, getTotalVideoFrameCount };

export function msToFrames(ms: number, fps = POST_VIDEO_FPS): number {
  return Math.max(1, Math.ceil(ms / (1000 / fps)));
}

export function getSlideDurationInFrames(slideIndex: number, slides: PostSlide[], fps = POST_VIDEO_FPS): number {
  return msToFrames(getSlideDwellMs(slideIndex, slides), fps);
}

export function getDeckDurationInFrames(slides: PostSlide[], fps = POST_VIDEO_FPS): number {
  return getTotalVideoFrameCount(slides, fps);
}

/** Cumulative start frame for each slide (length = slides.length). */
export function getSlideStartFrames(slides: PostSlide[], fps = POST_VIDEO_FPS): number[] {
  const starts: number[] = [];
  let cursor = 0;
  for (let i = 0; i < slides.length; i += 1) {
    starts.push(cursor);
    cursor += getSlideDurationInFrames(i, slides, fps);
  }
  return starts;
}

/** Map a global frame index to the active slide index. */
export function frameToSlideIndex(frame: number, slides: PostSlide[], fps = POST_VIDEO_FPS): number {
  if (slides.length === 0) return 0;
  const starts = getSlideStartFrames(slides, fps);
  let index = 0;
  for (let i = 0; i < starts.length; i += 1) {
    if (frame >= starts[i]) index = i;
    else break;
  }
  return index;
}

export function revealDurationInFrames(fps = POST_VIDEO_FPS): number {
  return msToFrames(REVEAL_ANIMATION_MS, fps);
}
